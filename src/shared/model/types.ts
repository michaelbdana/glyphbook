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

export type Chapter = {
  id: string;
  title: string;
  section: ChapterSection;
  numbered: boolean;
  content: ProseDoc;
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
};
