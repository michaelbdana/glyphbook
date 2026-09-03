import { create } from "zustand";
import type {
  Book,
  Chapter,
  ChapterOptions,
  ChapterSection,
} from "../../shared/model/types";
import { buildSampleBook } from "../../shared/model/sample";
import {
  makePresetChapter,
  PRESETS,
  type Preset,
} from "../../shared/model/presets";

export type Screen = "library" | "writing" | "formatting";
export type ToolId = "find" | "goals" | "sprint" | "quotes" | "editor";

type BookPatch = Partial<
  Pick<
    Book,
    | "title"
    | "author"
    | "projectName"
    | "version"
    | "goals"
    | "habit"
    | "habitLog"
    | "parts"
    | "volumes"
    | "themeName"
    | "theme"
  >
>;

type ChapterPatch = Partial<
  Pick<
    Chapter,
    | "title"
    | "content"
    | "numbered"
    | "options"
    | "partId"
    | "volumeId"
    | "section"
    | "image"
  >
>;

type State = {
  screen: Screen;
  books: Book[];
  activeBookId: string | null;
  selectedChapterId: string | null;
  previewOpen: boolean;
  saveState: "saved" | "saving";
  editorEpoch: number;
  tool: ToolId | null;
};

type Actions = {
  setScreen: (screen: Screen) => void;
  setActiveBook: (id: string) => void;
  loadBooks: (books: Book[]) => void;
  startBook: () => void;
  loadSample: () => void;
  importBook: (book: Book) => void;
  deleteBook: (id: string) => void;
  duplicateBook: (id: string) => void;
  updateBook: (bookId: string, patch: BookPatch) => void;
  addPresetPage: (presetKey: Preset["key"]) => void;
  deleteChapter: (chapterId: string) => void;
  selectChapter: (id: string) => void;
  updateChapter: (chapterId: string, patch: ChapterPatch) => void;
  reorderChapters: (chapters: Chapter[]) => void;
  setBookChapters: (chapters: Chapter[]) => void;
  recordWords: (bookId: string, delta: number) => void;
  togglePreview: () => void;
  setSaveState: (state: "saved" | "saving") => void;
  openTool: (tool: ToolId) => void;
  closeTool: () => void;
  addPart: (title: string, subtitle?: string) => void;
  addVolume: (title: string, subtitle?: string) => void;
  deletePart: (partId: string) => void;
  deleteVolume: (volumeId: string) => void;
  updateOptions: (chapterId: string, options: Partial<ChapterOptions>) => void;
};

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyChapter(title: string, section: ChapterSection, numbered: boolean): Chapter {
  return {
    id: newId(),
    title,
    section,
    numbered,
    kind: section === "body" ? "chapter" : "page",
    content: { type: "doc", content: [] },
  };
}

function standardFrontMatter(): Chapter[] {
  return [
    {
      ...emptyChapter("Title Page", "front", false),
      kind: "title",
    },
    {
      ...emptyChapter("Copyright", "front", false),
      kind: "copyright",
    },
    {
      ...emptyChapter("Table of Contents", "front", false),
      kind: "toc",
    },
  ];
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
      ...standardFrontMatter(),
      emptyChapter("Chapter 1", "body", true),
    ],
  };
}

function patchBook(
  book: Book,
  chapterId: string,
  patch: ChapterPatch,
): Book {
  return {
    ...book,
    updatedAt: new Date().toISOString(),
    chapters: book.chapters.map((ch) =>
      ch.id === chapterId ? { ...ch, ...patch } : ch,
    ),
  };
}

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export const useStore = create<State & Actions>((set, get) => ({
  screen: "library",
  books: [],
  activeBookId: null,
  selectedChapterId: null,
  previewOpen: false,
  saveState: "saved",
  editorEpoch: 0,
  tool: null,

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
        tool: null,
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

  importBook: (book) =>
    set((s) => ({
      books: [...s.books, book],
      activeBookId: book.id,
      selectedChapterId: book.chapters[0]?.id ?? null,
      tool: null,
    })),

  deleteBook: (id) =>
    set((s) => ({
      books: s.books.filter((b) => b.id !== id),
      activeBookId: s.activeBookId === id ? null : s.activeBookId,
      tool: null,
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

  addPresetPage: (presetKey) => {
    const { activeBookId } = get();
    if (!activeBookId) return;
    const preset = PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    const book = get().books.find((b) => b.id === activeBookId);
    if (!book) return;
    const chapter = makePresetChapter(book, preset);
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

  selectChapter: (id) => set({ selectedChapterId: id, tool: null }),

  updateChapter: (chapterId, patch) =>
    set((s) => ({
      books: s.books.map((b) =>
        b.id === s.activeBookId ? patchBook(b, chapterId, patch) : b,
      ),
    })),

  updateOptions: (chapterId, options) =>
    set((s) => ({
      books: s.books.map((b) => {
        if (b.id !== s.activeBookId) return b;
        return {
          ...b,
          updatedAt: new Date().toISOString(),
          chapters: b.chapters.map((ch) =>
            ch.id === chapterId
              ? { ...ch, options: { ...(ch.options ?? {}), ...options } }
              : ch,
          ),
        };
      }),
    })),

  reorderChapters: (chapters) =>
    set((s) => ({
      books: s.books.map((b) =>
        b.id === s.activeBookId
          ? { ...b, updatedAt: new Date().toISOString(), chapters }
          : b,
      ),
    })),

  setBookChapters: (chapters) =>
    set((s) => ({
      editorEpoch: s.editorEpoch + 1,
      books: s.books.map((b) =>
        b.id === s.activeBookId
          ? { ...b, updatedAt: new Date().toISOString(), chapters }
          : b,
      ),
    })),

  recordWords: (bookId, delta) =>
    set((s) => ({
      books: s.books.map((b) => {
        if (b.id !== bookId || delta <= 0) return b;
        const key = todayKey();
        const habitLog = { ...(b.habitLog ?? {}) };
        habitLog[key] = (habitLog[key] ?? 0) + delta;
        return { ...b, habitLog };
      }),
    })),

  togglePreview: () => set((s) => ({ previewOpen: !s.previewOpen })),

  openTool: (tool) => set({ tool }),
  closeTool: () => set({ tool: null }),

  addPart: (title, subtitle) =>
    set((s) => {
      if (!s.activeBookId) return s;
      const part = { id: newId(), title, subtitle };
      return {
        books: s.books.map((b) =>
          b.id === s.activeBookId
            ? {
                ...b,
                updatedAt: new Date().toISOString(),
                parts: [...(b.parts ?? []), part],
              }
            : b,
        ),
      };
    }),

  addVolume: (title, subtitle) =>
    set((s) => {
      if (!s.activeBookId) return s;
      const volume = { id: newId(), title, subtitle };
      return {
        books: s.books.map((b) =>
          b.id === s.activeBookId
            ? {
                ...b,
                updatedAt: new Date().toISOString(),
                volumes: [...(b.volumes ?? []), volume],
              }
            : b,
        ),
      };
    }),

  deletePart: (partId) =>
    set((s) => {
      if (!s.activeBookId) return s;
      return {
        books: s.books.map((b) => {
          if (b.id !== s.activeBookId) return b;
          const chapters = b.chapters.map((c) =>
            c.partId === partId ? { ...c, partId: undefined } : c,
          );
          return {
            ...b,
            updatedAt: new Date().toISOString(),
            chapters,
            parts: (b.parts ?? []).filter((p) => p.id !== partId),
          };
        }),
      };
    }),

  deleteVolume: (volumeId) =>
    set((s) => {
      if (!s.activeBookId) return s;
      return {
        books: s.books.map((b) => {
          if (b.id !== s.activeBookId) return b;
          const chapters = b.chapters.map((c) =>
            c.volumeId === volumeId ? { ...c, volumeId: undefined } : c,
          );
          const parts = (b.parts ?? []).map((p) =>
            p.volumeId === volumeId ? { ...p, volumeId: undefined } : p,
          );
          return {
            ...b,
            updatedAt: new Date().toISOString(),
            chapters,
            parts,
            volumes: (b.volumes ?? []).filter((v) => v.id !== volumeId),
          };
        }),
      };
    }),
}));
