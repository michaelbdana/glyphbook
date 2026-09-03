import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { IPC } from "../src/shared/ipc";
import { buildSampleBook } from "../src/shared/model/sample";
import { validateLibrary } from "../src/shared/model/validation";
import type { Book } from "../src/shared/model/types";
import { mergeTheme } from "../src/shared/model/theme";
import {
  applyPrintToTheme,
  type BookPrint,
} from "../src/shared/model/prints";
import {
  exportBookSnapshot,
  loadLibrary,
  saveLibrary,
} from "./library";
import { loadSettings, saveSettings } from "./settingsStore";
import type { EditorSettings } from "../src/shared/settings";
import { buildEpubBuffer } from "./exporters/epub";
import { buildDocxBuffer } from "./exporters/docx";
import { parseDocx } from "./importers/docx";
import { EPUB_PROFILES } from "../src/shared/model/epubProfiles";

let mainWindow: BrowserWindow | null = null;
let printWindow: BrowserWindow | null = null;

const tmpUserData = process.env.GLYPHBOOK_TMP_USERDATA;
if (tmpUserData) {
  app.setPath("userData", tmpUserData);
}

let pendingPdfBook: Book = buildSampleBook();
let pendingPdfPrint: BookPrint | null = null;

function pdfSetup() {
  const base = mergeTheme(pendingPdfBook.themeName, pendingPdfBook.theme);
  const theme = pendingPdfPrint ? applyPrintToTheme(base, pendingPdfPrint) : base;
  return {
    theme,
    bleed: pendingPdfPrint?.bleed ?? false,
    bookTitle: pendingPdfBook.title,
    authorName: pendingPdfBook.author,
    headers: pendingPdfPrint?.headerFooter
      ? {
          top: pendingPdfPrint.headerFooter.header,
          bottom: pendingPdfPrint.headerFooter.footer,
        }
      : undefined,
  };
}

function safeFileName(title: string): string {
  return title.replace(/[^\w-]+/g, "_").slice(0, 60) || "book";
}

function exportsDir(): string {
  return path.join(app.getPath("userData"), "exports");
}

function preloadPath(): string {
  return path.join(__dirname, "preload.js");
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Glyphbook",
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void mainWindow.loadURL(`${devUrl}/src/renderer/index.html`);
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, "../../dist/src/renderer/index.html"),
    );
  }

  if (process.env.GLYPHBOOK_SMOKE === "1") {
    mainWindow.webContents.on("console-message", (details) => {
      if (details.level === "error") {
        console.log(`[main-window:error] ${details.message}`);
      }
    });
    mainWindow.webContents.on("did-fail-load", (_e, code, desc) => {
      console.log(`[main-window:fail] ${code} ${desc}`);
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function getPrintWindow(): BrowserWindow {
  if (printWindow && !printWindow.isDestroyed()) {
    return printWindow;
  }
  printWindow = new BrowserWindow({
    width: 900,
    height: 1200,
    show: process.env.GLYPHBOOK_SMOKE !== "1",
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (process.env.GLYPHBOOK_SMOKE === "1") {
    printWindow.webContents.on("page-title-updated", (_event, title) => {
      console.log(`[print] ${title}`);
    });
  }
  printWindow.on("closed", () => {
    printWindow = null;
  });
  void printWindow.loadFile(
    path.join(__dirname, "../../dist/src/print/index.html"),
  );
  return printWindow;
}

function registerIpc(): void {
  ipcMain.handle(IPC.spikeGetBook, () => pendingPdfBook);

  ipcMain.handle(IPC.spikePrint, async (event) => {
    const buffer = await event.sender.printToPDF({
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
    });
    await fs.mkdir(exportsDir(), { recursive: true });
    const suffix = pendingPdfPrint ? `-${safeFileName(pendingPdfPrint.label)}` : "";
    const outPath = path.join(
      exportsDir(),
      `${safeFileName(pendingPdfBook.title)}${suffix}.pdf`,
    );
    await fs.writeFile(outPath, buffer);
    if (process.env.GLYPHBOOK_SMOKE === "1") {
      console.log(`SPIKE OK path=${outPath} bytes=${buffer.length}`);
    }
    return outPath;
  });

  ipcMain.handle(IPC.printResult, async (_event, filePath: string) => {
    return announceExport("PDF", filePath);
  });

  ipcMain.handle(IPC.spikeOpen, async () => {
    const win = getPrintWindow();
    if (process.env.GLYPHBOOK_SMOKE !== "1") {
      win.webContents.reload();
    }
    return win.id;
  });

  ipcMain.handle(IPC.exportEpub, async (_event, book: Book, options?: { profile?: string; quiet?: boolean }) => {
    const profile = EPUB_PROFILES.find((p) => p.id === options?.profile) ?? EPUB_PROFILES[5];
    const buffer = await buildEpubBuffer(book, { profile: profile.id });
    await fs.mkdir(exportsDir(), { recursive: true });
    const outPath = path.join(
      exportsDir(),
      `${safeFileName(book.title)}-${profile.fileNameSuffix}.epub`,
    );
    await fs.writeFile(outPath, buffer);
    if (options?.quiet) return { ok: true as const, path: outPath };
    return announceExport(`${profile.label} ePub`, outPath);
  });

  ipcMain.handle(IPC.exportDocx, async (_event, book: Book) => {
    const buffer = await buildDocxBuffer(book);
    await fs.mkdir(exportsDir(), { recursive: true });
    const outPath = path.join(
      exportsDir(),
      `${safeFileName(book.title)}.docx`,
    );
    await fs.writeFile(outPath, buffer);
    return announceExport("DOCX", outPath);
  });

  ipcMain.handle(IPC.exportPdf, async (_event, book: Book, print?: BookPrint) => {
    pendingPdfBook = book;
    pendingPdfPrint = print ?? null;
    const win = getPrintWindow();
    if (process.env.GLYPHBOOK_SMOKE !== "1") {
      win.webContents.reload();
    }
    return win.id;
  });

  ipcMain.handle(IPC.exportTheme, () => pdfSetup());

  ipcMain.handle(IPC.importDocx, async () => {
    if (!mainWindow) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "Import a Word document",
      properties: ["openFile"],
      filters: [{ name: "Word documents", extensions: ["docx"] }],
    });
    if (canceled || filePaths.length === 0) return null;
    const filePath = filePaths[0];
    const buffer = await fs.readFile(filePath);
    const defaultTitle = path.basename(filePath, path.extname(filePath));
    return parseDocx(buffer, defaultTitle);
  });

  ipcMain.handle(IPC.libraryLoad, async () => {
    const books = await loadLibrary();
    return books === null ? null : validateLibrary(books);
  });

  ipcMain.handle(IPC.librarySave, async (_event, books: Book[]) => {
    return saveLibrary(validateLibrary(books));
  });

  ipcMain.handle(IPC.libraryExportBook, async (_event, book: Book) => {
    return exportBookSnapshot(book);
  });

  ipcMain.handle(IPC.settingsLoad, async () => loadSettings());

  ipcMain.handle(IPC.settingsSave, async (_event, settings: EditorSettings) => {
    return saveSettings(settings);
  });

  ipcMain.handle(IPC.spellSet, async (event, enabled: boolean) => {
    event.sender.session.setSpellCheckerEnabled(enabled);
    return true;
  });

  ipcMain.handle(IPC.imagePick, async () => {
    if (!mainWindow) return { ok: false as const };
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "Choose an image",
      properties: ["openFile"],
      filters: [
        { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
      ],
    });
    if (canceled || filePaths.length === 0) return { ok: false as const };
    const filePath = filePaths[0];
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : "image/jpeg";
    const buffer = await fs.readFile(filePath);
    return {
      ok: true as const,
      name: path.basename(filePath),
      dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
    };
  });
}

async function announceExport(
  kind: string,
  filePath: string,
): Promise<{ ok: boolean; path: string }> {
  if (mainWindow) {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: `${kind} exported`,
      message: `${kind} written to your exports folder`,
      detail: filePath,
      buttons: ["OK", "Reveal in folder"],
    });
    if (response === 1) {
      shell.showItemInFolder(filePath);
    }
  }
  return { ok: true, path: filePath };
}

void app.whenReady().then(() => {
  registerIpc();
  createMainWindow();

  if (process.env.GLYPHBOOK_SMOKE === "1") {
    getPrintWindow();
  }

  if (process.env.GLYPHBOOK_SMOKE_SAVE === "1") {
    void (async () => {
      const result = await saveLibrary([buildSampleBook()]);
      console.log(`SAVE RESULT ${JSON.stringify(result)}`);
      app.quit();
    })();
  }

  if (process.env.GLYPHBOOK_SMOKE_EXPORT === "1") {
    void (async () => {
      const book = buildSampleBook();
      const epub = await buildEpubBuffer(book);
      const docx = await buildDocxBuffer(book);
      const dir = path.join(app.getPath("userData"), "exports");
      await fs.mkdir(dir, { recursive: true });
      const epubPath = path.join(dir, "smoke.epub");
      const docxPath = path.join(dir, "smoke.docx");
      await fs.writeFile(epubPath, epub);
      await fs.writeFile(docxPath, docx);
      console.log(`EPUB OK bytes=${epub.length}`);
      console.log(`DOCX OK bytes=${docx.length}`);
      app.quit();
    })();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
