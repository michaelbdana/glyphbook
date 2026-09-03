import { contextBridge, ipcRenderer } from "electron";
import type { Book } from "../src/shared/model/types";
import type { EditorSettings } from "../src/shared/settings";

export type SaveResult = { ok: boolean; path?: string; error?: string };

contextBridge.exposeInMainWorld("glyphbook", {
  runSpike: () => ipcRenderer.invoke("spike:open"),
  getSpikeBook: () => ipcRenderer.invoke("spike:get-book"),
  spikePrint: () => ipcRenderer.invoke("spike:print"),
  showPrintResult: (filePath: string) =>
    ipcRenderer.invoke("print:result", filePath),
  loadLibrary: () => ipcRenderer.invoke("library:load"),
  saveLibrary: (books: Book[]) => ipcRenderer.invoke("library:save", books),
  exportBook: (book: Book) => ipcRenderer.invoke("library:export-book", book),
  loadSettings: () => ipcRenderer.invoke("settings:load"),
  saveSettings: (settings: EditorSettings) =>
    ipcRenderer.invoke("settings:save", settings),
  setSpellCheck: (enabled: boolean) =>
    ipcRenderer.invoke("spell:set", enabled),
  pickImage: () => ipcRenderer.invoke("image:pick"),
  exportPdf: (book: Book) => ipcRenderer.invoke("export:pdf", book),
  exportEpub: (book: Book, options?: { profile?: string; quiet?: boolean }) =>
    ipcRenderer.invoke("export:epub", book, options),
  exportDocx: (book: Book) => ipcRenderer.invoke("export:docx", book),
  importDocx: () => ipcRenderer.invoke("import:docx"),
});
