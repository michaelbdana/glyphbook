import { create } from "zustand";
import type { BookEntry } from "../../global";
import type {
  Book,
  Chapter,
  ChapterOptions,
  ChapterSection,
} from "../../shared/model/types";
import { defaultPrints, type BookPrint } from "../../shared/model/prints";
import { makePresetChapter, PRESETS, type Preset } from "../../shared/model/presets";

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
    | "prints"
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
    | "kind"
    | "image"
  >
>;

export type State = {
  screen: Screen;
  books: Book[];
  activeBookId: string | null;
  selectedChapterId: string | null;
  previewOpen: boolean;
  filePaths: Record<string, string>;
  revision: Record<string, number>;
  savedRevision: Record<string, number>;
  editorEpoch: number;
  tool: ToolId | null;
};

type Actions = {
  setScreen: (screen: Screen) => void;
  setActiveBook: (id: string) => void;
  setLoadedBooks: (entries: BookEntry[]) => void;
  addBook: (book: Book, filePath: string) => void;
  updateBookPath: (id: string, filePath: string) => void;
  markSaved: (id: string, revision: number) => void;
  deleteBook: (id: string) => void;
  updateBook: (bookId: string, patch: BookPatch) => void;
  addPresetPage: (presetKey: Preset["key"]) => void;
  deleteChapter: (chapterId: string) => void;
  selectChapter: (id: string) => void;
  updateChapter: (chapterId: string, patch: ChapterPatch) => void;
  reorderChapters: (chapters: Chapter[]) => void;
  setBookChapters: (chapters: Chapter[]) => void;
  recordWords: (bookId: string, delta: number) => void;
  togglePreview: () => void;
  openTool: (tool: ToolId) => void;
  closeTool: () => void;
  addPart: (title: string, subtitle?: string) => void;
  addVolume: (title: string, subtitle?: string) => void;
  deletePart: (partId: string) => void;
  deleteVolume: (volumeId: string) => void;
  updateOptions: (chapterId: string, options: Partial<ChapterOptions>) => void;
  updatePrint: (print: BookPrint) => void;
};

export function ensurePrints(book: Book): Book {
  if (book.prints && book.prints.length > 0) return book;
  return { ...book, prints: defaultPrints() };
}

export function blankBook(title: string): Book {
  const now = new Date().toISOString();
  return ensurePrints({
    id: newId(),
    title,
    author: "Untitled",
    createdAt: now,
    updatedAt: now,
    chapters: [...standardFrontMatter(), emptyChapter("Chapter 1", "body", true)],
  });
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyChapter(
  title: string,
  section: ChapterSection,
  numbered: boolean,
): Chapter {
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

function edited(
  revision: Record<string, number>,
  bookId: string,
): Pick<State, "revision"> {
  return {
    revision: { ...revision, [bookId]: (revision[bookId] ?? 0) + 1 },
  };
}

function patchBook(book: Book, chapterId: string, patch: ChapterPatch): Book {
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

export function isBookDirty(
  revision: Record<string, number>,
  savedRevision: Record<string, number>,
  bookId: string | null,
): boolean {
  return bookId !== null && (revision[bookId] ?? 0) !== (savedRevision[bookId] ?? 0);
}

export const useStore = create<State & Actions>((set, get) => ({
  screen: "library",
  books: [],
  activeBookId: null,
  selectedChapterId: null,
  previewOpen: false,
  filePaths: {},
  revision: {},
  savedRevision: {},
  editorEpoch: 0,
  tool: null,

  setScreen: (screen) => set({ screen }),

  setLoadedBooks: (entries) =>
    set(() => {
      const books = entries.map((e) => ensurePrints(e.book));
      const filePaths: Record<string, string> = {};
      for (const e of entries) filePaths[e.book.id] = e.path;
      return {
        books,
        filePaths,
        revision: {},
        savedRevision: {},
        activeBookId: null,
        selectedChapterId: null,
        tool: null,
      };
    }),

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

  addBook: (book, filePath) =>
    set((s) => {
      if (s.books.some((b) => b.id === book.id)) return s;
      const ensured = ensurePrints(book);
      return {
        books: [...s.books, ensured],
        filePaths: { ...s.filePaths, [ensured.id]: filePath },
        activeBookId: ensured.id,
        selectedChapterId: ensured.chapters[0]?.id ?? null,
        tool: null,
      };
    }),

  updateBookPath: (id, filePath) =>
    set((s) => ({ filePaths: { ...s.filePaths, [id]: filePath } })),

  markSaved: (id, revision) =>
    set((s) => {
      if ((s.revision[id] ?? 0) !== revision) return s;
      return { savedRevision: { ...s.savedRevision, [id]: revision } };
    }),

  deleteBook: (id) =>
    set((s) => {
      const revision = { ...s.revision };
      const savedRevision = { ...s.savedRevision };
      const filePaths = { ...s.filePaths };
      delete revision[id];
      delete savedRevision[id];
      delete filePaths[id];
      return {
        books: s.books.filter((b) => b.id !== id),
        filePaths,
        revision,
        savedRevision,
        activeBookId: s.activeBookId === id ? null : s.activeBookId,
        selectedChapterId: s.activeBookId === id ? null : s.selectedChapterId,
        tool: s.activeBookId === id ? null : s.tool,
      };
    }),

  updateBook: (bookId, patch) =>
    set((s) => ({
      books: s.books.map((b) =>
        b.id === bookId ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b,
      ),
      ...edited(s.revision, bookId),
    })),

  addPresetPage: (presetKey) => {
    const { activeBookId } = get();
    if (!activeBookId) return;
    const book = get().books.find((b) => b.id === activeBookId);
    if (!book) return;
    const preset = PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
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
      ...edited(s.revision, activeBookId),
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
        ...edited(s.revision, s.activeBookId),
        selectedChapterId: selected,
      };
    }),

  selectChapter: (id) => set({ selectedChapterId: id, tool: null }),

  updateChapter: (chapterId, patch) =>
    set((s) => {
      if (!s.activeBookId) return s;
      return {
        books: s.books.map((b) =>
          b.id === s.activeBookId ? patchBook(b, chapterId, patch) : b,
        ),
        ...edited(s.revision, s.activeBookId),
      };
    }),

  updateOptions: (chapterId, options) =>
    set((s) => {
      if (!s.activeBookId) return s;
      return {
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
        ...edited(s.revision, s.activeBookId),
      };
    }),

  reorderChapters: (chapters) =>
    set((s) => {
      if (!s.activeBookId) return s;
      return {
        books: s.books.map((b) =>
          b.id === s.activeBookId
            ? { ...b, updatedAt: new Date().toISOString(), chapters }
            : b,
        ),
        ...edited(s.revision, s.activeBookId),
      };
    }),

  setBookChapters: (chapters) =>
    set((s) => {
      if (!s.activeBookId) return s;
      return {
        editorEpoch: s.editorEpoch + 1,
        books: s.books.map((b) =>
          b.id === s.activeBookId
            ? { ...b, updatedAt: new Date().toISOString(), chapters }
            : b,
        ),
        ...edited(s.revision, s.activeBookId),
      };
    }),

  recordWords: (bookId, delta) =>
    set((s) => {
      if (delta <= 0) return s;
      const book = s.books.find((b) => b.id === bookId);
      if (!book) return s;
      const key = todayKey();
      const habitLog = { ...(book.habitLog ?? {}) };
      habitLog[key] = (habitLog[key] ?? 0) + delta;
      return {
        books: s.books.map((b) => (b.id === bookId ? { ...b, habitLog } : b)),
        ...edited(s.revision, bookId),
      };
    }),

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
        ...edited(s.revision, s.activeBookId),
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
        ...edited(s.revision, s.activeBookId),
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
        ...edited(s.revision, s.activeBookId),
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
        ...edited(s.revision, s.activeBookId),
      };
    }),

  updatePrint: (print) =>
    set((s) => {
      if (!s.activeBookId) return s;
      return {
        books: s.books.map((b) => {
          if (b.id !== s.activeBookId) return b;
          const prints = (b.prints ?? defaultPrints()).map((p) =>
            p.id === print.id ? print : p,
          );
          const has = (b.prints ?? []).some((p) => p.id === print.id);
          return {
            ...b,
            updatedAt: new Date().toISOString(),
            prints: has ? prints : [...prints, print],
          };
        }),
        ...edited(s.revision, s.activeBookId),
      };
    }),
}));
