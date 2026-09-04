import type { Book } from "./shared/model/types";
import type { EditorSettings } from "./shared/settings";
import type { BookPrint, HeaderBoxes } from "./shared/model/prints";
import type { BookTheme } from "./shared/model/theme";
import type { MenuCommand } from "./shared/ipc";

export type PdfSetup = {
  theme: BookTheme;
  bleed: boolean;
  bookTitle: string;
  authorName: string;
  headers?: { top?: HeaderBoxes; bottom?: HeaderBoxes };
};

export type SaveResult = {
  ok: boolean;
  path?: string;
  canceled?: boolean;
  error?: string;
};
export type BookEntry = { path: string; book: Book };
export type SaveAsResult = {
  ok: boolean;
  path?: string;
  canceled?: boolean;
  error?: string;
};
export type ExportOptions = {
  bookFilePath?: string;
  dir?: string;
  quiet?: boolean;
};

export type ImagePickResult =
  { ok: true; name: string; dataUrl: string } | { ok: false };

export type GlyphbookApi = {
  runSpike: () => Promise<number>;
  getSpikeBook: () => Promise<Book>;
  spikePrint: () => Promise<string>;
  showPrintResult: (filePath: string) => Promise<void>;
  loadBookShelf: () => Promise<BookEntry[]>;
  openBook: () => Promise<BookEntry | null>;
  saveBook: (filePath: string, book: Book) => Promise<SaveResult>;
  saveBookAs: (book: Book, startPath?: string) => Promise<SaveAsResult>;
  saveBookDefault: (book: Book) => Promise<SaveResult>;
  deleteBookFile: (filePath: string) => Promise<SaveResult>;
  persistShelf: (paths: string[]) => Promise<SaveResult>;
  onMenuCommand: (callback: (command: MenuCommand) => void) => () => void;
  onConfirmClose: (callback: () => void) => () => void;
  allowClose: () => Promise<void>;
  loadSettings: () => Promise<EditorSettings>;
  saveSettings: (settings: EditorSettings) => Promise<SaveResult>;
  setSpellCheck: (enabled: boolean) => Promise<boolean>;
  pickImage: () => Promise<ImagePickResult>;
  exportPdf: (
    book: Book,
    print?: BookPrint,
    options?: ExportOptions,
  ) => Promise<string | null>;
  getPdfSetup: () => Promise<PdfSetup>;
  chooseExportDir: (bookFilePath?: string) => Promise<SaveAsResult>;
  exportEpub: (
    book: Book,
    options?: { profile?: string } & ExportOptions,
  ) => Promise<SaveResult>;
  exportDocx: (book: Book, options?: ExportOptions) => Promise<SaveResult>;
  importDocx: () => Promise<Book | null>;
};

declare global {
  interface Window {
    glyphbook: GlyphbookApi;
  }
}

export {};
