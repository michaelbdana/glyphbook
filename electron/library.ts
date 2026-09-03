import { app } from "electron";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Book } from "../src/shared/model/types";
import { serializeLibrary } from "../src/shared/model/validation";

const SNAPSHOT_INTERVAL_MS = 60_000;
const SNAPSHOT_RETENTION = 10;

function libraryDir(): string {
  return path.join(app.getPath("userData"), "library");
}

function libraryFile(): string {
  return path.join(libraryDir(), "library.json");
}

function snapshotsDir(): string {
  return path.join(libraryDir(), "snapshots");
}

function writeJsonAtomic(filePath: string, contents: string): Promise<void> {
  const tmp = `${filePath}.tmp`;
  return fs.writeFile(tmp, contents, "utf8").then(() => fs.rename(tmp, filePath));
}

async function pruneSnapshots(): Promise<void> {
  const dir = snapshotsDir();
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return;
  }
  const files = entries
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();
  for (const file of files.slice(SNAPSHOT_RETENTION)) {
    await fs.unlink(path.join(dir, file)).catch(() => undefined);
  }
}

export type SaveResult = { ok: boolean; path?: string; error?: string };

export async function loadLibrary(): Promise<Book[] | null> {
  try {
    const raw = await fs.readFile(libraryFile(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as { books?: unknown }).books)
    ) {
      return (parsed as { books: Book[] }).books;
    }
    return null;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw err;
  }
}

let lastSnapshotAt = 0;

export async function saveLibrary(books: Book[]): Promise<SaveResult> {
  try {
    await fs.mkdir(libraryDir(), { recursive: true });
    await writeJsonAtomic(libraryFile(), serializeLibrary(books));

    const now = Date.now();
    if (now - lastSnapshotAt >= SNAPSHOT_INTERVAL_MS) {
      await fs.mkdir(snapshotsDir(), { recursive: true });
      const stamp = new Date(now).toISOString().replace(/[:.]/g, "-");
      await writeJsonAtomic(
        path.join(snapshotsDir(), `library-${stamp}.json`),
        serializeLibrary(books),
      );
      lastSnapshotAt = now;
      await pruneSnapshots();
    }
    return { ok: true, path: libraryFile() };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function exportBookSnapshot(book: Book): Promise<SaveResult> {
  try {
    await fs.mkdir(libraryDir(), { recursive: true });
    const safe = book.title.replace(/[^\w-]+/g, "_").slice(0, 60);
    const outPath = path.join(libraryDir(), `${safe}-snapshot.json`);
    await writeJsonAtomic(outPath, JSON.stringify(book, null, 2));
    return { ok: true, path: outPath };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
