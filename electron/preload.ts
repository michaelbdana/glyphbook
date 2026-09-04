import { contextBridge, ipcRenderer } from "electron";
import type { Book } from "../src/shared/model/types";
import type { EditorSettings } from "../src/shared/settings";
import type { BookPrint } from "../src/shared/model/prints";
import type { BookTheme } from "../src/shared/model/theme";
import type { MenuCommand } from "../src/shared/ipc";

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

contextBridge.exposeInMainWorld("glyphbook", {
  runSpike: () => ipcRenderer.invoke("spike:open"),
  getSpikeBook: () => ipcRenderer.invoke("spike:get-book"),
  spikePrint: () => ipcRenderer.invoke("spike:print"),
  showPrintResult: (filePath: string) => ipcRenderer.invoke("print:result", filePath),
  loadBookShelf: () => ipcRenderer.invoke("book:load-shelf"),
  openBook: () => ipcRenderer.invoke("book:open"),
  saveBook: (filePath: string, book: Book) =>
    ipcRenderer.invoke("book:save", filePath, book),
  saveBookAs: (book: Book, startPath?: string) =>
    ipcRenderer.invoke("book:save-as", book, startPath),
  saveBookDefault: (book: Book) => ipcRenderer.invoke("book:save-default", book),
  deleteBookFile: (filePath: string) =>
    ipcRenderer.invoke("book:delete-file", filePath),
  persistShelf: (paths: string[]) => ipcRenderer.invoke("book:persist-shelf", paths),
  onMenuCommand: (callback: (command: MenuCommand) => void) => {
    const listener = (_event: unknown, command: MenuCommand) => callback(command);
    ipcRenderer.on("menu:command", listener);
    return () => {
      ipcRenderer.removeListener("menu:command", listener);
    };
  },
  onConfirmClose: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("app:confirm-close", listener);
    return () => {
      ipcRenderer.removeListener("app:confirm-close", listener);
    };
  },
  allowClose: () => ipcRenderer.invoke("app:allow-close"),
  loadSettings: () => ipcRenderer.invoke("settings:load"),
  saveSettings: (settings: EditorSettings) =>
    ipcRenderer.invoke("settings:save", settings),
  setSpellCheck: (enabled: boolean) => ipcRenderer.invoke("spell:set", enabled),
  pickImage: () => ipcRenderer.invoke("image:pick"),
  exportPdf: (book: Book, print?: BookPrint, options?: ExportOptions) =>
    ipcRenderer.invoke("export:pdf", book, print, options),
  chooseExportDir: (bookFilePath?: string) =>
    ipcRenderer.invoke("export:choose-dir", bookFilePath),
  getPdfSetup: () =>
    ipcRenderer.invoke("export:get-theme") as Promise<{
      theme: BookTheme;
      bleed: boolean;
      bookTitle: string;
    }>,
  exportEpub: (book: Book, options?: { profile?: string } & ExportOptions) =>
    ipcRenderer.invoke("export:epub", book, options),
  exportDocx: (book: Book, options?: ExportOptions) =>
    ipcRenderer.invoke("export:docx", book, options),
  importDocx: () => ipcRenderer.invoke("import:docx"),
});
