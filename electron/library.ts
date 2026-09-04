import { app } from "electron";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Book } from "../src/shared/model/types";
import {
  parseBookFile,
  sanitizeBook,
  serializeBookFile,
} from "../src/shared/model/validation";

export const BOOK_FILE_EXT = ".glyphbook";

export type SaveResult = { ok: boolean; path?: string; error?: string };
export type BookEntry = { path: string; book: Book };

function shelfDir(): string {
  return path.join(app.getPath("userData"), "library");
}

function bookshelfFile(): string {
  return path.join(shelfDir(), "bookshelf.json");
}

function legacyLibraryFile(): string {
  return path.join(shelfDir(), "library.json");
}

function writeJsonAtomic(filePath: string, contents: string): Promise<void> {
  const tmp = `${filePath}.tmp`;
  return fs.writeFile(tmp, contents, "utf8").then(() => fs.rename(tmp, filePath));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function defaultBooksDir(): Promise<string> {
  const override = process.env.GLYPHBOOK_BOOKS_DIR;
  if (override) {
    await fs.mkdir(override, { recursive: true });
    return override;
  }
  const preferred = path.join(app.getPath("documents"), "Glyphbook Books");
  try {
    await fs.mkdir(preferred, { recursive: true });
    return preferred;
  } catch {
    const fallback = path.join(app.getPath("userData"), "books");
    await fs.mkdir(fallback, { recursive: true });
    return fallback;
  }
}

function safeFileName(title: string): string {
  return title.replace(/[^\w-]+/g, "_").slice(0, 60) || "book";
}

export async function uniqueBookPath(dir: string, book: Book): Promise<string> {
  const base = path.join(dir, safeFileName(book.title));
  let candidate = `${base}${BOOK_FILE_EXT}`;
  let n = 2;
  while (await fileExists(candidate)) {
    candidate = `${base}-${n}${BOOK_FILE_EXT}`;
    n += 1;
  }
  return candidate;
}

export async function writeBookFile(filePath: string, book: Book): Promise<SaveResult> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await writeJsonAtomic(filePath, serializeBookFile(book));
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function readBookFile(filePath: string): Promise<Book | null> {
  try {
    return parseBookFile(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

export async function deleteBookFile(filePath: string): Promise<SaveResult> {
  try {
    await fs.unlink(filePath);
    return { ok: true };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { ok: true };
    return { ok: false, error: String(err) };
  }
}

async function readBookshelf(): Promise<string[]> {
  try {
    const raw = JSON.parse(await fs.readFile(bookshelfFile(), "utf8")) as {
      books?: unknown;
    };
    if (Array.isArray(raw.books)) {
      return raw.books.filter((p): p is string => typeof p === "string");
    }
  } catch {
    // no bookshelf yet
  }
  return [];
}

async function persistBookshelf(paths: string[]): Promise<void> {
  await fs.mkdir(shelfDir(), { recursive: true });
  await writeJsonAtomic(
    bookshelfFile(),
    JSON.stringify({ schemaVersion: 1, books: paths }, null, 2),
  );
}

async function migrateLegacyLibraryOnce(): Promise<void> {
  if (await fileExists(bookshelfFile())) return;
  let raw: string;
  try {
    raw = await fs.readFile(legacyLibraryFile(), "utf8");
  } catch {
    return;
  }
  const parsed: unknown = JSON.parse(raw);
  const list =
    typeof parsed === "object" &&
    parsed !== null &&
    Array.isArray((parsed as { books?: unknown }).books)
      ? (parsed as { books: unknown[] }).books
      : [];
  const books: Book[] = [];
  for (const rawBook of list) {
    const book = sanitizeBook(rawBook);
    if (book) books.push(book);
  }
  if (books.length === 0) return;
  const dir = await defaultBooksDir();
  const paths: string[] = [];
  for (const book of books) {
    const target = await uniqueBookPath(dir, book);
    await writeBookFile(target, book);
    paths.push(target);
  }
  await persistBookshelf(paths);
  await fs
    .rename(legacyLibraryFile(), path.join(shelfDir(), "library-legacy-backup.json"))
    .catch(() => undefined);
}

export async function loadShelfBooks(): Promise<BookEntry[]> {
  await migrateLegacyLibraryOnce();
  const paths = await readBookshelf();
  const entries: BookEntry[] = [];
  const gone: string[] = [];
  for (const filePath of paths) {
    const book = await readBookFile(filePath);
    if (book) entries.push({ path: filePath, book });
    else gone.push(filePath);
  }
  if (gone.length > 0) {
    await persistBookshelf(paths.filter((p) => !gone.includes(p))).catch(
      () => undefined,
    );
  }
  return entries;
}

export async function persistShelfForPaths(paths: string[]): Promise<SaveResult> {
  try {
    await persistBookshelf(paths);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
