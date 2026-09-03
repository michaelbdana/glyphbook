import { app } from "electron";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  DEFAULT_EDITOR_SETTINGS,
  type EditorSettings,
  mergeSettings,
} from "../src/shared/settings";

function settingsFile(): string {
  return path.join(app.getPath("userData"), "settings.json");
}

export async function loadSettings(): Promise<EditorSettings> {
  try {
    const raw = await fs.readFile(settingsFile(), "utf8");
    return mergeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_EDITOR_SETTINGS };
  }
}

export async function saveSettings(
  settings: EditorSettings,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const file = settingsFile();
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(settings, null, 2), "utf8");
    await fs.rename(tmp, file);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
