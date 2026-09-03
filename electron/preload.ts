import { contextBridge, ipcRenderer } from "electron";
import type { Book } from "../src/shared/model/types";

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
});
