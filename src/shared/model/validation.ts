import type {
  Book,
  Chapter,
  ChapterKind,
  ChapterOptions,
  ChapterSection,
  Part,
  ProseBlock,
  ProseDoc,
  ProseInline,
  TextAlign,
  Volume,
} from "./types";
import { DEFAULT_CHAPTER_OPTIONS } from "./presets";
import {
  defaultPrint,
  printKindLabel,
  type BookPrint,
  type PrintInk,
  type PrintKind,
  type PrintPaper,
} from "./prints";

export const CURRENT_SCHEMA_VERSION = 1;

const SECTIONS: ChapterSection[] = ["front", "body", "back"];
const PRINT_KINDS = new Set<PrintKind>(["paperback", "hardcover", "largePrint"]);
const PRINT_INKS = new Set<PrintInk>(["bw", "standardColor", "premiumColor"]);
const PRINT_PAPERS = new Set<PrintPaper>(["white", "cream", "groundwood"]);
const KINDS = new Set<ChapterKind>([
  "chapter",
  "page",
  "title",
  "copyright",
  "toc",
  "dedication",
  "epigraph",
  "prologue",
  "epilogue",
  "blurbs",
  "foreword",
  "preface",
  "introduction",
  "afterword",
  "acknowledgements",
  "about",
  "alsoby",
  "fullpage",
  "cover",
]);
const INCLUDE_IN = new Set(["all", "ebook", "print", "none"]);
const BEGIN_ON = new Set(["auto", "left", "right"]);
const TEXT_ALIGNS = new Set(["left", "center", "right", "justify"]);

function sanitizeTextAlign(value: Record<string, unknown>): { textAlign?: TextAlign } {
  const align = value.textAlign;
  if (typeof align === "string" && TEXT_ALIGNS.has(align)) {
    return { textAlign: align as TextAlign };
  }
  return {};
}

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
    const attrs = isRecord(value.attrs) ? sanitizeTextAlign(value.attrs) : {};
    return Object.keys(attrs).length
      ? { type: "paragraph", attrs, content }
      : { type: "paragraph", content };
  }

  if (type === "heading") {
    const level =
      isRecord(value.attrs) && typeof value.attrs.level === "number"
        ? Math.min(Math.max(Math.round(value.attrs.level), 2), 6)
        : 2;
    const attrs = {
      level,
      ...(isRecord(value.attrs) ? sanitizeTextAlign(value.attrs) : {}),
    };
    const content: ProseInline[] = [];
    if (Array.isArray(value.content)) {
      for (const inline of value.content) {
        const clean = sanitizeInline(inline);
        if (clean) content.push(clean);
      }
    }
    return { type: "heading", attrs, content };
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
  const kindRaw = value.kind;
  const kind = KINDS.has(kindRaw as ChapterKind)
    ? (kindRaw as ChapterKind)
    : undefined;
  return {
    id: sanitizeText(value.id, `ch-${index}-${Date.now()}`),
    title,
    section,
    numbered:
      typeof value.numbered === "boolean" ? value.numbered : section === "body",
    content: sanitizeDoc(value.content),
    kind,
    options: isRecord(value.options)
      ? sanitizeOptions(value.options)
      : undefined,
    partId:
      typeof value.partId === "string" && value.partId
        ? value.partId
        : undefined,
    volumeId:
      typeof value.volumeId === "string" && value.volumeId
        ? value.volumeId
        : undefined,
    image: isRecord(value.image)
      ? cloneAs<NonNullable<Chapter["image"]>>(value.image)
      : undefined,
  };
}

function sanitizeOptions(value: Record<string, unknown>): ChapterOptions {
  const options = { ...DEFAULT_CHAPTER_OPTIONS };
  if (INCLUDE_IN.has(value.includeIn as string)) {
    options.includeIn = value.includeIn as ChapterOptions["includeIn"];
  }
  if (BEGIN_ON.has(value.beginOn as string)) {
    options.beginOn = value.beginOn as ChapterOptions["beginOn"];
  }
  for (const key of [
    "hideHeading",
    "hidePageNumber",
    "hideHeaderFooter",
    "hideToc",
    "smallerTitle",
    "invertText",
  ] as const) {
    if (typeof value[key] === "boolean") options[key] = value[key];
  }
  return options;
}

function sanitizeParts(value: unknown): Part[] {
  if (!Array.isArray(value)) return [];
  const parts: Part[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const id = typeof raw.id === "string" ? raw.id : "";
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!id || !title) continue;
    const part: Part = { id, title };
    if (typeof raw.subtitle === "string") part.subtitle = raw.subtitle;
    if (typeof raw.volumeId === "string") part.volumeId = raw.volumeId;
    parts.push(part);
  }
  return parts;
}

function sanitizeVolumes(value: unknown): Volume[] {
  if (!Array.isArray(value)) return [];
  const volumes: Volume[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const id = typeof raw.id === "string" ? raw.id : "";
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!id || !title) continue;
    const volume: Volume = { id, title };
    if (typeof raw.subtitle === "string") volume.subtitle = raw.subtitle;
    volumes.push(volume);
  }
  return volumes;
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizePrint(value: unknown): BookPrint | null {
  if (!isRecord(value)) return null;
  const kind: PrintKind = PRINT_KINDS.has(value.kind as PrintKind)
    ? (value.kind as PrintKind)
    : "paperback";
  const base = defaultPrint(kind, 0);
  const ink: PrintInk = PRINT_INKS.has(value.ink as PrintInk)
    ? (value.ink as PrintInk)
    : base.ink;
  const paper: PrintPaper = PRINT_PAPERS.has(value.paper as PrintPaper)
    ? (value.paper as PrintPaper)
    : base.paper;
  const print: BookPrint = {
    id: typeof value.id === "string" && value.id ? value.id : base.id,
    kind,
    label:
      typeof value.label === "string" && value.label.trim()
        ? value.label.trim()
        : printKindLabel(kind),
    trimWidthIn: numberOr(value.trimWidthIn, base.trimWidthIn),
    trimHeightIn: numberOr(value.trimHeightIn, base.trimHeightIn),
    bleed: booleanOr(value.bleed, base.bleed),
    ink,
    paper,
    marginTopIn: numberOr(value.marginTopIn, base.marginTopIn),
    marginBottomIn: numberOr(value.marginBottomIn, base.marginBottomIn),
    marginInsideIn: numberOr(value.marginInsideIn, base.marginInsideIn),
    marginOutsideIn: numberOr(value.marginOutsideIn, base.marginOutsideIn),
  };
  if (typeof value.fontSizePt === "number") {
    print.fontSizePt = Math.max(8, Math.min(40, value.fontSizePt));
  }
  if (typeof value.lineHeight === "number") {
    print.lineHeight = Math.max(1, Math.min(3, value.lineHeight));
  }
  if (typeof value.justify === "boolean") print.justify = value.justify;
  return print;
}

function sanitizePrints(value: unknown): BookPrint[] {
  if (!Array.isArray(value)) return [];
  const prints: BookPrint[] = [];
  for (const raw of value) {
    const print = sanitizePrint(raw);
    if (print) prints.push(print);
  }
  return prints;
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
    parts: Array.isArray(value.parts) ? sanitizeParts(value.parts) : undefined,
    volumes: Array.isArray(value.volumes)
      ? sanitizeVolumes(value.volumes)
      : undefined,
    themeName:
      typeof value.themeName === "string" && value.themeName
        ? value.themeName
        : undefined,
    theme: isRecord(value.theme)
      ? cloneAs<NonNullable<Book["theme"]>>(value.theme)
      : undefined,
    cover: isRecord(value.cover)
      ? cloneAs<NonNullable<Book["cover"]>>(value.cover)
      : undefined,
    prints: Array.isArray(value.prints) ? sanitizePrints(value.prints) : undefined,
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
