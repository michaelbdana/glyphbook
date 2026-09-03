import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("glyphbook", {
  runSpike: () => ipcRenderer.invoke("spike:open"),
  getSpikeBook: () => ipcRenderer.invoke("spike:get-book"),
  spikePrint: () => ipcRenderer.invoke("spike:print"),
  showPrintResult: (filePath: string) =>
    ipcRenderer.invoke("print:result", filePath),
});
