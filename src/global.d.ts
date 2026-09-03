import type { Book } from "./shared/model/types";

export type GlyphbookApi = {
  runSpike: () => Promise<number>;
  getSpikeBook: () => Promise<Book>;
  spikePrint: () => Promise<string>;
  showPrintResult: (filePath: string) => Promise<void>;
};

declare global {
  interface Window {
    glyphbook: GlyphbookApi;
  }
}

export {};
