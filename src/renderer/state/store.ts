import { create } from "zustand";
import type { Book, Chapter, ChapterSection } from "../../shared/model/types";
import { buildSampleBook } from "../../shared/model/sample";
import { emptyDoc } from "../editor/doc";

export type Screen = "library" | "writing" | "formatting";

type State = {
  screen: Screen;
  books: Book[];
  activeBookId: string | null;
  selectedChapterId: string | null;
  previewOpen: boolean;
  saveState: "saved" | "saving";
};

type BookPatch = Partial<
  Pick<Book, "title" | "author" | "projectName" | "version">
>;

type Actions = {
  setScreen: (screen: Screen) => void;
  setActiveBook: (id: string) => void;
  loadBooks: (books: Book[]) => void;
  startBook: () => void;
  loadSample: () => void;
  deleteBook: (id: string) => void;
  duplicateBook: (id: string) => void;
  updateBook: (bookId: string, patch: BookPatch) => void;
  addChapter: (section: ChapterSection) => void;
  deleteChapter: (chapterId: string) => void;
  selectChapter: (id: string) => void;
  updateChapter: (
    chapterId: string,
    patch: Partial<Pick<Chapter, "title" | "content" | "numbered">>,
  ) => void;
  reorderChapters: (chapters: Chapter[]) => void;
  togglePreview: () => void;
  setSaveState: (state: "saved" | "saving") => void;
};

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function blankBook(title: string): Book {
  const now = new Date().toISOString();
  return {
    id: newId(),
    title,
    author: "Untitled",
    createdAt: now,
    updatedAt: now,
    chapters: [
      {
        id: newId(),
        title: "Chapter 1",
        section: "body",
        numbered: true,
        content: emptyDoc(),
      },
    ],
  };
}

function patchBook(
  book: Book,
  chapterId: string,
  patch: Partial<Pick<Chapter, "title" | "content" | "numbered">>,
): Book {
  return {
    ...book,
    updatedAt: new Date().toISOString(),
    chapters: book.chapters.map((ch) =>
      ch.id === chapterId ? { ...ch, ...patch } : ch,
    ),
  };
}

export const useStore = create<State & Actions>((set, get) => ({
  screen: "library",
  books: [buildSampleBook()],
  activeBookId: null,
  selectedChapterId: null,
  previewOpen: false,
  saveState: "saved",

  setScreen: (screen) => set({ screen }),

  loadBooks: (books) =>
    set((s) => {
      const active = s.activeBookId;
      const stillPresent = books.some((b) => b.id === active);
      return {
        books,
        activeBookId: stillPresent ? active : null,
        selectedChapterId: stillPresent ? s.selectedChapterId : null,
      };
    }),

  setSaveState: (saveState) => set({ saveState }),

  setActiveBook: (id) =>
    set((s) => {
      const book = s.books.find((b) => b.id === id);
      if (!book) return s;
      const rest = s.books.filter((b) => b.id !== id);
      return {
        books: [book, ...rest],
        activeBookId: id,
        selectedChapterId: book.chapters[0]?.id ?? null,
      };
    }),

  startBook: () => {
    const book = blankBook("Untitled Book");
    set((s) => ({ books: [...s.books, book], activeBookId: book.id }));
  },

  loadSample: () => {
    const book = buildSampleBook();
    set((s) => ({ books: [...s.books, book], activeBookId: book.id }));
  },

  deleteBook: (id) =>
    set((s) => ({
      books: s.books.filter((b) => b.id !== id),
      activeBookId: s.activeBookId === id ? null : s.activeBookId,
    })),

  duplicateBook: (id) =>
    set((s) => {
      const book = s.books.find((b) => b.id === id);
      if (!book) return s;
      const copy: Book = {
        ...book,
        id: newId(),
        title: `${book.title} (copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chapters: book.chapters.map((ch) => ({
          ...ch,
          id: newId(),
          content: JSON.parse(JSON.stringify(ch.content)),
        })),
      };
      return { books: [...s.books, copy] };
    }),

  updateBook: (bookId, patch) =>
    set((s) => ({
      books: s.books.map((b) =>
        b.id === bookId
          ? { ...b, ...patch, updatedAt: new Date().toISOString() }
          : b,
      ),
    })),

  addChapter: (section) => {
    const { activeBookId } = get();
    if (!activeBookId) return;
    const count =
      get().books.find((b) => b.id === activeBookId)?.chapters.filter(
        (c) => c.section === section && c.title.startsWith("Chapter"),
      ).length ?? 0;
    const chapter: Chapter = {
      id: newId(),
      title:
        section === "body" ? `Chapter ${count + 1}` : "New Page",
      section,
      numbered: section === "body",
      content: emptyDoc(),
    };
    set((s) => ({
      books: s.books.map((b) =>
        b.id === activeBookId
          ? {
              ...b,
              updatedAt: new Date().toISOString(),
              chapters: [...b.chapters, chapter],
            }
          : b,
      ),
      selectedChapterId: chapter.id,
    }));
  },

  selectChapter: (id) => set({ selectedChapterId: id }),

  deleteChapter: (chapterId) =>
    set((s) => {
      if (!s.activeBookId) return s;
      const book = s.books.find((b) => b.id === s.activeBookId);
      if (!book) return s;
      const chapters = book.chapters.filter((c) => c.id !== chapterId);
      let selected = s.selectedChapterId;
      if (selected === chapterId) {
        const firstBody = chapters.find((c) => c.section === "body");
        selected = (firstBody ?? chapters[0] ?? null)?.id ?? null;
      }
      return {
        books: s.books.map((b) =>
          b.id === s.activeBookId
            ? { ...b, updatedAt: new Date().toISOString(), chapters }
            : b,
        ),
        selectedChapterId: selected,
      };
    }),

  updateChapter: (chapterId, patch) =>
    set((s) => ({
      books: s.books.map((b) =>
        b.id === s.activeBookId ? patchBook(b, chapterId, patch) : b,
      ),
    })),

  reorderChapters: (chapters) =>
    set((s) => ({
      books: s.books.map((b) =>
        b.id === s.activeBookId
          ? { ...b, updatedAt: new Date().toISOString(), chapters }
          : b,
      ),
    })),

  togglePreview: () => set((s) => ({ previewOpen: !s.previewOpen })),
}));
