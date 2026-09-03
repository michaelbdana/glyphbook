import type { BookThemeOverride } from "./theme";

export type ProseInline = {
  type: "text";
  text: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

export type ProseBlock =
  | {
      type: "paragraph";
      content?: ProseInline[];
    }
  | {
      type: "heading";
      attrs?: { level?: number };
      content?: ProseInline[];
    };

export type ProseDoc = {
  type: "doc";
  content?: ProseBlock[];
};

export type ChapterSection = "front" | "body" | "back";

export type ChapterOptions = {
  includeIn: "all" | "ebook" | "print" | "none";
  beginOn: "auto" | "left" | "right";
  hideHeading: boolean;
  hidePageNumber: boolean;
  hideHeaderFooter: boolean;
  hideToc: boolean;
  smallerTitle: boolean;
  invertText: boolean;
};

export type ChapterKind =
  | "chapter"
  | "page"
  | "title"
  | "copyright"
  | "toc"
  | "dedication"
  | "epigraph"
  | "prologue"
  | "epilogue"
  | "blurbs"
  | "foreword"
  | "preface"
  | "introduction"
  | "afterword"
  | "acknowledgements"
  | "about"
  | "alsoby";

export type Chapter = {
  id: string;
  title: string;
  section: ChapterSection;
  numbered: boolean;
  content: ProseDoc;
  kind?: ChapterKind;
  options?: Partial<ChapterOptions>;
  partId?: string;
  volumeId?: string;
};

export type Part = {
  id: string;
  title: string;
  subtitle?: string;
  volumeId?: string;
};

export type Volume = {
  id: string;
  title: string;
  subtitle?: string;
};

export type BookGoals = {
  targetWords?: number;
  dueDate?: string;
  writingDays?: number[];
};

export type BookHabit = {
  dailyWords?: number;
  writingDays?: number[];
};

export type Book = {
  id: string;
  title: string;
  author: string;
  projectName?: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
  goals?: BookGoals;
  habit?: BookHabit;
  habitLog?: Record<string, number>;
  parts?: Part[];
  volumes?: Volume[];
  themeName?: string;
  theme?: BookThemeOverride;
};
