import type { Book } from "./shared/model/types";
import type { EditorSettings } from "./shared/settings";

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
  exportPdf: (book: Book) => Promise<number>;
  exportEpub: (book: Book) => Promise<SaveResult>;
  exportDocx: (book: Book) => Promise<SaveResult>;
};

declare global {
  interface Window {
    glyphbook: GlyphbookApi;
  }
}

export {};
