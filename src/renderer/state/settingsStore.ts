import { create } from "zustand";
import {
  DEFAULT_EDITOR_SETTINGS,
  type EditorSettings,
  type ParagraphSpacing,
} from "../../shared/settings";

type State = EditorSettings;

type Actions = {
  replace: (settings: EditorSettings) => void;
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: number) => void;
  setLineHeight: (lineHeight: number) => void;
  setParagraphSpacing: (paragraphSpacing: ParagraphSpacing) => void;
  setSpellCheck: (spellCheck: boolean) => void;
};

export const useSettingsStore = create<State & Actions>((set) => ({
  ...DEFAULT_EDITOR_SETTINGS,

  replace: (settings) => set({ ...settings }),

  setFontFamily: (fontFamily) => set({ fontFamily }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLineHeight: (lineHeight) => set({ lineHeight }),
  setParagraphSpacing: (paragraphSpacing) => set({ paragraphSpacing }),
  setSpellCheck: (spellCheck) => set({ spellCheck }),
}));
