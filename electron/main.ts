import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { IPC } from "../src/shared/ipc";
import { buildSampleBook } from "../src/shared/model/sample";
import { validateLibrary } from "../src/shared/model/validation";
import type { Book } from "../src/shared/model/types";
import {
  exportBookSnapshot,
  loadLibrary,
  saveLibrary,
} from "./library";
import { loadSettings, saveSettings } from "./settingsStore";
import type { EditorSettings } from "../src/shared/settings";

let mainWindow: BrowserWindow | null = null;
let printWindow: BrowserWindow | null = null;

const tmpUserData = process.env.GLYPHBOOK_TMP_USERDATA;
if (process.env.GLYPHBOOK_SMOKE_SAVE === "1" && tmpUserData) {
  app.setPath("userData", tmpUserData);
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
  ipcMain.handle(IPC.spikeGetBook, () => buildSampleBook());

  ipcMain.handle(IPC.spikePrint, async (event) => {
    const buffer = await event.sender.printToPDF({
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
    });
    const outPath = path.join(app.getPath("temp"), "glyphbook-spike.pdf");
    await fs.writeFile(outPath, buffer);
    if (process.env.GLYPHBOOK_SMOKE === "1") {
      console.log(`SPIKE OK path=${outPath} bytes=${buffer.length}`);
    }
    return outPath;
  });

  ipcMain.handle(IPC.printResult, async (_event, filePath: string) => {
    if (!mainWindow) return;
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Print spike complete",
      message: "Sample PDF written",
      detail: filePath,
      buttons: ["OK", "Reveal in folder"],
    });
    if (response === 1) {
      shell.showItemInFolder(filePath);
    }
  });

  ipcMain.handle(IPC.spikeOpen, async () => {
    const win = getPrintWindow();
    return win.id;
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
