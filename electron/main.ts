import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { IPC } from "../src/shared/ipc";
import { buildSampleBook } from "../src/shared/model/sample";

let mainWindow: BrowserWindow | null = null;
let printWindow: BrowserWindow | null = null;

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
}

void app.whenReady().then(() => {
  registerIpc();
  createMainWindow();

  if (process.env.GLYPHBOOK_SMOKE === "1") {
    getPrintWindow();
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
