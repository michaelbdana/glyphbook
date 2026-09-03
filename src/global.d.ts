import type { Book } from "./shared/model/types";
import type { EditorSettings } from "./shared/settings";
import type { BookPrint } from "./shared/model/prints";
import type { BookTheme } from "./shared/model/theme";

export type PdfSetup = { theme: BookTheme; bleed: boolean; bookTitle: string };

export type SaveResult = { ok: boolean; path?: string; error?: string };

export type ImagePickResult =
  | { ok: true; name: string; dataUrl: string }
  | { ok: false };

export type GlyphbookApi = {
  runSpike: () => Promise<number>;
  getSpikeBook: () => Promise<Book>;
  spikePrint: () => Promise<string>;
  showPrintResult: (filePath: string) => Promise<void>;
  loadLibrary: () => Promise<Book[] | null>;
  saveLibrary: (books: Book[]) => Promise<SaveResult>;
  exportBook: (book: Book) => Promise<SaveResult>;
  loadSettings: () => Promise<EditorSettings>;
  saveSettings: (settings: EditorSettings) => Promise<SaveResult>;
  setSpellCheck: (enabled: boolean) => Promise<boolean>;
  pickImage: () => Promise<ImagePickResult>;
  exportPdf: (book: Book, print?: BookPrint) => Promise<number>;
  getPdfSetup: () => Promise<PdfSetup>;
  exportEpub: (
    book: Book,
    options?: { profile?: string; quiet?: boolean },
  ) => Promise<SaveResult>;
  exportDocx: (book: Book) => Promise<SaveResult>;
  importDocx: () => Promise<Book | null>;
};

declare global {
  interface Window {
    glyphbook: GlyphbookApi;
  }
}

export {};
