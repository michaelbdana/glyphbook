import type {
  Book,
  Chapter,
  ChapterSection,
  ProseBlock,
  ProseDoc,
  ProseInline,
} from "./types";

export const CURRENT_SCHEMA_VERSION = 1;

const SECTIONS: ChapterSection[] = ["front", "body", "back"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneAs<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
const KNOWN_MARKS = new Set([
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
  "subscript",
  "superscript",
  "smallCaps",
  "monospace",
  "sansSerif",
]);

function sanitizeMarks(value: unknown): ProseInline["marks"] {
  if (!Array.isArray(value)) return undefined;
  const marks: NonNullable<ProseInline["marks"]> = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    if (typeof raw.type !== "string") continue;
    if (!KNOWN_MARKS.has(raw.type)) continue;
    const mark: (typeof marks)[number] = { type: raw.type };
    if (isRecord(raw.attrs) && Object.keys(raw.attrs).length > 0) {
      mark.attrs = raw.attrs;
    }
    marks.push(mark);
  }
  return marks.length > 0 ? marks : undefined;
}

function sanitizeInline(value: unknown): ProseInline | null {
  if (!isRecord(value)) return null;
  const type = value.type;
  if (typeof type !== "string") return null;

  if (type === "text") {
    if (typeof value.text !== "string") return null;
    return { type: "text", text: value.text, marks: sanitizeMarks(value.marks) };
  }

  return cloneAs<ProseInline>(value);
}

function sanitizeBlock(value: unknown): ProseBlock | null {
  if (!isRecord(value)) return null;
  const type = value.type;
  if (typeof type !== "string") return null;

  if (type === "paragraph") {
    const content: ProseInline[] = [];
    if (Array.isArray(value.content)) {
      for (const inline of value.content) {
        const clean = sanitizeInline(inline);
        if (clean) content.push(clean);
      }
    }
    return { type: "paragraph", content };
  }

  if (type === "heading") {
    const level =
      isRecord(value.attrs) && typeof value.attrs.level === "number"
        ? Math.min(Math.max(Math.round(value.attrs.level), 2), 6)
        : 2;
    const content: ProseInline[] = [];
    if (Array.isArray(value.content)) {
      for (const inline of value.content) {
        const clean = sanitizeInline(inline);
        if (clean) content.push(clean);
      }
    }
    return { type: "heading", attrs: { level }, content };
  }

  return cloneAs<ProseBlock>(value);
}

function sanitizeDoc(value: unknown): ProseDoc {
  if (!isRecord(value) || value.type !== "doc") {
    return { type: "doc", content: [] };
  }
  const content: ProseBlock[] = [];
  if (Array.isArray(value.content)) {
    for (const block of value.content) {
      const clean = sanitizeBlock(block);
      if (clean) content.push(clean);
    }
  }
  return { type: "doc", content };
}

function sanitizeText(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function sanitizeChapter(value: unknown, index: number): Chapter | null {
  if (!isRecord(value)) return null;
  const title = sanitizeText(value.title, `Chapter ${index + 1}`).trim();
  if (!title) return null;
  const section = SECTIONS.includes(value.section as ChapterSection)
    ? (value.section as ChapterSection)
    : "body";
  return {
    id: sanitizeText(value.id, `ch-${index}-${Date.now()}`),
    title,
    section,
    numbered:
      typeof value.numbered === "boolean" ? value.numbered : section === "body",
    content: sanitizeDoc(value.content),
  };
}

export function sanitizeBook(value: unknown): Book | null {
  if (!isRecord(value)) return null;
  const now = new Date().toISOString();
  const chapters: Chapter[] = [];
  if (Array.isArray(value.chapters)) {
    for (const [index, raw] of value.chapters.entries()) {
      const chapter = sanitizeChapter(raw, index);
      if (chapter) chapters.push(chapter);
    }
  }
  return {
    id: sanitizeText(value.id, `book-${Date.now()}`),
    title: sanitizeText(value.title, "Untitled Book") || "Untitled Book",
    author: sanitizeText(value.author, "Untitled"),
    projectName:
      typeof value.projectName === "string" ? value.projectName : undefined,
    version: typeof value.version === "string" ? value.version : undefined,
    createdAt: sanitizeText(value.createdAt, now),
    updatedAt: sanitizeText(value.updatedAt, now),
    chapters,
    goals: isRecord(value.goals)
      ? cloneAs<NonNullable<Book["goals"]>>(value.goals)
      : undefined,
    habit: isRecord(value.habit)
      ? cloneAs<NonNullable<Book["habit"]>>(value.habit)
      : undefined,
    habitLog: isRecord(value.habitLog)
      ? cloneAs<NonNullable<Book["habitLog"]>>(value.habitLog)
      : undefined,
  };
}

export function validateLibrary(value: unknown): Book[] {
  if (!Array.isArray(value)) return [];
  const books: Book[] = [];
  for (const raw of value) {
    const book = sanitizeBook(raw);
    if (book) books.push(book);
  }
  return books;
}

export function serializeLibrary(books: Book[]): string {
  return JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION, books });
}
