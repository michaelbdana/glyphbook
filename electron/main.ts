import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  shell,
  type Event,
  type MenuItemConstructorOptions,
} from "electron";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { IPC, type MenuCommand } from "../src/shared/ipc";
import { buildSampleBook } from "../src/shared/model/sample";
import type { Book } from "../src/shared/model/types";
import { mergeTheme } from "../src/shared/model/theme";
import { applyPrintToTheme, type BookPrint } from "../src/shared/model/prints";
import {
  BOOK_FILE_EXT,
  deleteBookFile,
  defaultBooksDir,
  loadShelfBooks,
  persistShelfForPaths,
  readBookFile,
  uniqueBookPath,
  writeBookFile,
  type BookEntry,
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
let pendingPdfDir: string | null = null;
let pendingPdfQuiet = false;
let printResolver: ((filePath: string) => void) | null = null;

let allowExit = false;

type ExportOptions = {
  bookFilePath?: string;
  dir?: string;
  quiet?: boolean;
};

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

async function chooseExportFolder(bookFilePath?: string): Promise<string | null> {
  if (!mainWindow) return null;
  const defaultDir = bookFilePath ? path.dirname(bookFilePath) : exportsDir();
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: "Choose where to save your export",
    defaultPath: defaultDir,
    properties: ["openDirectory", "createDirectory"],
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
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
  mainWindow.on("close", guardClose);
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
  void printWindow.loadFile(path.join(__dirname, "../../dist/src/print/index.html"));
  return printWindow;
}

function installAppMenu(): void {
  const send = (command: MenuCommand) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC.menuCommand, command);
    }
  };
  const isMac = process.platform === "darwin";
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: "appMenu" as const }] : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Book…",
          accelerator: "CmdOrCtrl+N",
          click: () => send("new"),
        },
        {
          label: "Open Book…",
          accelerator: "CmdOrCtrl+O",
          click: () => send("open"),
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => send("save"),
        },
        {
          label: "Save As…",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => send("saveAs"),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    { label: "Edit", role: "editMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function guardClose(event: Event): void {
  if (allowExit || !mainWindow || mainWindow.isDestroyed()) return;
  event.preventDefault();
  mainWindow.webContents.send(IPC.confirmClose);
}

function registerIpc(): void {
  ipcMain.handle(IPC.spikeGetBook, () => pendingPdfBook);

  ipcMain.handle(IPC.spikePrint, async (event) => {
    const buffer = await event.sender.printToPDF({
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
    });
    const dir = pendingPdfDir ?? exportsDir();
    await fs.mkdir(dir, { recursive: true });
    const suffix = pendingPdfPrint ? `-${safeFileName(pendingPdfPrint.label)}` : "";
    const outPath = path.join(
      dir,
      `${safeFileName(pendingPdfBook.title)}${suffix}.pdf`,
    );
    await fs.writeFile(outPath, buffer);
    if (process.env.GLYPHBOOK_SMOKE === "1") {
      console.log(`SPIKE OK path=${outPath} bytes=${buffer.length}`);
    }
    return outPath;
  });

  ipcMain.handle(IPC.printResult, async (_event, filePath: string) => {
    const quiet = pendingPdfQuiet;
    pendingPdfDir = null;
    pendingPdfQuiet = false;
    const resolver = printResolver;
    printResolver = null;
    const result = quiet
      ? { ok: true as const, path: filePath }
      : await announceExport("PDF", filePath);
    if (resolver) resolver(filePath);
    return result;
  });

  ipcMain.handle(IPC.spikeOpen, async () => {
    const win = getPrintWindow();
    if (process.env.GLYPHBOOK_SMOKE !== "1") {
      win.webContents.reload();
    }
    return win.id;
  });

  ipcMain.handle(
    IPC.exportEpub,
    async (
      _event,
      book: Book,
      options?: { profile?: string; quiet?: boolean } & ExportOptions,
    ) => {
      const profile =
        EPUB_PROFILES.find((p) => p.id === options?.profile) ?? EPUB_PROFILES[5];
      const buffer = await buildEpubBuffer(book, { profile: profile.id });
      const dir = options?.dir ?? (await chooseExportFolder(options?.bookFilePath));
      if (!dir) return { ok: false as const, canceled: true };
      await fs.mkdir(dir, { recursive: true });
      const outPath = path.join(
        dir,
        `${safeFileName(book.title)}-${profile.fileNameSuffix}.epub`,
      );
      await fs.writeFile(outPath, buffer);
      if (options?.quiet) return { ok: true as const, path: outPath };
      return announceExport(`${profile.label} ePub`, outPath);
    },
  );

  ipcMain.handle(
    IPC.exportDocx,
    async (_event, book: Book, options?: ExportOptions) => {
      const buffer = await buildDocxBuffer(book);
      const dir = options?.dir ?? (await chooseExportFolder(options?.bookFilePath));
      if (!dir) return { ok: false as const, canceled: true };
      await fs.mkdir(dir, { recursive: true });
      const outPath = path.join(dir, `${safeFileName(book.title)}.docx`);
      await fs.writeFile(outPath, buffer);
      if (options?.quiet) return { ok: true as const, path: outPath };
      return announceExport("DOCX", outPath);
    },
  );

  ipcMain.handle(
    IPC.exportPdf,
    async (
      _event,
      book: Book,
      print?: BookPrint,
      options?: { quiet?: boolean } & ExportOptions,
    ) => {
      const dir = options?.dir ?? (await chooseExportFolder(options?.bookFilePath));
      if (!dir) return null;
      pendingPdfDir = dir;
      pendingPdfQuiet = options?.quiet === true;
      pendingPdfBook = book;
      pendingPdfPrint = print ?? null;
      const win = getPrintWindow();
      const filePath = await new Promise<string>((resolve) => {
        printResolver = resolve;
        if (process.env.GLYPHBOOK_SMOKE !== "1") {
          win.webContents.reload();
        } else {
          resolve("");
        }
      });
      return filePath || null;
    },
  );

  ipcMain.handle(IPC.exportChooseDir, async (_event, bookFilePath?: string) => {
    const dir = await chooseExportFolder(bookFilePath);
    if (!dir) return { ok: false as const, canceled: true };
    return { ok: true as const, path: dir };
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

  ipcMain.handle(IPC.bookLoadShelf, async () => {
    const entries = await loadShelfBooks();
    return entries;
  });

  ipcMain.handle(IPC.bookOpen, async () => {
    if (!mainWindow) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "Open a Glyphbook book",
      properties: ["openFile"],
      filters: [{ name: "Glyphbook books", extensions: ["glyphbook"] }],
    });
    if (canceled || filePaths.length === 0) return null;
    const filePath = filePaths[0];
    const book = await readBookFile(filePath);
    if (!book) {
      await dialog.showMessageBox(mainWindow, {
        type: "warning",
        title: "Could not open book",
        message: "This file is not a valid Glyphbook book.",
        detail: filePath,
        buttons: ["OK"],
      });
      return null;
    }
    return { path: filePath, book } satisfies BookEntry;
  });

  ipcMain.handle(IPC.bookSave, async (_event, filePath: string, book: Book) => {
    return writeBookFile(filePath, book);
  });

  ipcMain.handle(IPC.bookSaveAs, async (_event, book: Book, startPath?: string) => {
    if (!mainWindow) return { ok: false as const };
    const dir = startPath ? path.dirname(startPath) : await defaultBooksDir();
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Save your book",
      defaultPath: path.join(dir, safeFileName(book.title) + BOOK_FILE_EXT),
      filters: [{ name: "Glyphbook books", extensions: ["glyphbook"] }],
    });
    if (canceled || !filePath) {
      return { ok: false as const, canceled: true };
    }
    const target = filePath.endsWith(BOOK_FILE_EXT)
      ? filePath
      : `${filePath}${BOOK_FILE_EXT}`;
    return writeBookFile(target, book);
  });

  ipcMain.handle(IPC.bookSaveDefault, async (_event, book: Book) => {
    const dir = await defaultBooksDir();
    const target = await uniqueBookPath(dir, book);
    return writeBookFile(target, book);
  });

  ipcMain.handle(IPC.bookDelete, async (_event, filePath: string) => {
    return deleteBookFile(filePath);
  });

  ipcMain.handle(IPC.bookPersistShelf, async (_event, paths: string[]) => {
    return persistShelfForPaths(paths);
  });

  ipcMain.handle(IPC.allowClose, async () => {
    allowExit = true;
    if (process.platform === "darwin") {
      mainWindow?.close();
    } else {
      app.quit();
    }
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
      filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] }],
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
      message: `${kind} written to the folder you chose`,
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
  if (
    process.env.GLYPHBOOK_SMOKE === "1" ||
    process.env.GLYPHBOOK_SMOKE_SAVE === "1" ||
    process.env.GLYPHBOOK_SMOKE_EXPORT === "1"
  ) {
    allowExit = true;
  }
  registerIpc();
  createMainWindow();
  installAppMenu();
  app.on("before-quit", guardClose);

  if (process.env.GLYPHBOOK_SMOKE === "1") {
    getPrintWindow();
  }

  if (process.env.GLYPHBOOK_SMOKE_SAVE === "1") {
    void (async () => {
      const book = buildSampleBook();
      const dir = await defaultBooksDir();
      const target = await uniqueBookPath(dir, book);
      const result = await writeBookFile(target, book);
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
