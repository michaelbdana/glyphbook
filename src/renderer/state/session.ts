import type { Book } from "../../shared/model/types";
import { buildSampleBook } from "../../shared/model/sample";
import { blankBook, ensurePrints, useStore } from "./store";

function openId(id: string): void {
  useStore.getState().setActiveBook(id);
  useStore.getState().setScreen("writing");
}

function pathOf(bookId: string): string | null {
  return useStore.getState().filePaths[bookId] ?? null;
}

export async function initSession(): Promise<void> {
  const entries = await window.glyphbook.loadBookShelf();
  useStore.getState().setLoadedBooks(entries);
}

export function shelfPaths(): string {
  const s = useStore.getState();
  return s.books
    .map((b) => s.filePaths[b.id])
    .filter(Boolean)
    .join("|");
}

export function hasUnsavedBooks(): boolean {
  const s = useStore.getState();
  return s.books.some((b) => (s.revision[b.id] ?? 0) !== (s.savedRevision[b.id] ?? 0));
}

export async function newBook(): Promise<void> {
  const book = blankBook("Untitled Book");
  const placed = await window.glyphbook.saveBookAs(book);
  if (!placed.ok || !placed.path) return;
  useStore.getState().addBook(book, placed.path);
  openId(book.id);
}

export async function openBookFromDialog(): Promise<void> {
  const entry = await window.glyphbook.openBook();
  if (!entry) return;
  const book = ensurePrints(entry.book);
  const state = useStore.getState();
  if (state.books.some((b) => b.id === book.id)) {
    openId(book.id);
    return;
  }
  state.addBook(book, entry.path);
  openId(book.id);
}

export async function addSampleBook(): Promise<void> {
  const book = ensurePrints(buildSampleBook());
  const result = await window.glyphbook.saveBookDefault(book);
  if (!result.ok || !result.path) return;
  useStore.getState().addBook(book, result.path);
  openId(book.id);
}

export async function importDocxBook(): Promise<void> {
  const imported = await window.glyphbook.importDocx();
  if (!imported) return;
  const book = ensurePrints(imported);
  const placed = await window.glyphbook.saveBookAs(book);
  if (!placed.ok || !placed.path) return;
  useStore.getState().addBook(book, placed.path);
  openId(book.id);
}

async function saveBookTo(
  bookId: string,
  filePath: string,
  revision: number,
): Promise<void> {
  const book = useStore.getState().books.find((b) => b.id === bookId);
  if (!book) return;
  const result = await window.glyphbook.saveBook(filePath, book);
  if (result.ok) useStore.getState().markSaved(bookId, revision);
}

export async function saveActiveBook(): Promise<boolean> {
  const state = useStore.getState();
  const id = state.activeBookId;
  if (!id) return false;
  const filePath = pathOf(id);
  if (!filePath) return false;
  await saveBookTo(id, filePath, state.revision[id] ?? 0);
  return true;
}

export async function saveActiveBookAs(): Promise<void> {
  const state = useStore.getState();
  const id = state.activeBookId;
  if (!id) return;
  const book = state.books.find((b) => b.id === id);
  if (!book) return;
  const placed = await window.glyphbook.saveBookAs(book, pathOf(id) ?? undefined);
  if (!placed.ok || !placed.path) return;
  const store = useStore.getState();
  store.updateBookPath(id, placed.path);
  store.markSaved(id, state.revision[id] ?? 0);
}

export async function saveBookAsExisting(bookId: string): Promise<void> {
  const state = useStore.getState();
  const book = state.books.find((b) => b.id === bookId);
  if (!book) return;
  const placed = await window.glyphbook.saveBookAs(
    book,
    state.filePaths[bookId] ?? undefined,
  );
  if (!placed.ok || !placed.path) return;
  const store = useStore.getState();
  store.updateBookPath(bookId, placed.path);
  store.markSaved(bookId, state.revision[bookId] ?? 0);
}

export async function duplicateBook(bookId: string): Promise<void> {
  const original = useStore.getState().books.find((b) => b.id === bookId);
  if (!original) return;
  const copy: Book = {
    ...original,
    id: Math.random().toString(36).slice(2, 10),
    title: `${original.title} (copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    chapters: original.chapters.map((ch) => ({
      ...ch,
      id: Math.random().toString(36).slice(2, 10),
      content: JSON.parse(JSON.stringify(ch.content)),
    })),
  };
  const placed = await window.glyphbook.saveBookAs(copy);
  if (!placed.ok || !placed.path) return;
  useStore.getState().addBook(copy, placed.path);
  openId(copy.id);
}

export async function deleteBook(bookId: string): Promise<void> {
  const state = useStore.getState();
  const book = state.books.find((b) => b.id === bookId);
  if (!book) return;
  const filePath = state.filePaths[bookId];
  const location = filePath ? `\n\nFile: ${filePath}` : "";
  const confirmed = window.confirm(
    `Delete “${book.title}”?${location}\n\nThis removes it from My Books and deletes the saved book file. This cannot be undone.`,
  );
  if (!confirmed) return;
  if (filePath) {
    await window.glyphbook.deleteBookFile(filePath);
  }
  useStore.getState().deleteBook(bookId);
}

export function handleMenuCommand(command: string): void {
  switch (command) {
    case "new":
      void newBook();
      break;
    case "open":
      void openBookFromDialog();
      break;
    case "save":
      void saveActiveBook();
      break;
    case "saveAs":
      void saveActiveBookAs();
      break;
    default:
      break;
  }
}

export function confirmCloseAllowed(): boolean {
  if (!hasUnsavedBooks()) return true;
  return window.confirm(
    "You have unsaved changes to one or more books.\nClose Glyphbook and discard those changes?",
  );
}
