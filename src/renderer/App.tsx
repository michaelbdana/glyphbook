import { useEffect, useRef } from "react";
import { useStore } from "./state/store";
import {
  confirmCloseAllowed,
  handleMenuCommand,
  initSession,
  shelfPaths,
} from "./state/session";
import { useSettingsStore } from "./state/settingsStore";
import { countWords } from "../shared/services/wordCount";
import type { Book } from "../shared/model/types";
import TopBar from "./components/TopBar";
import LibraryScreen from "./screens/LibraryScreen";
import WritingScreen from "./screens/WritingScreen";
import FormattingScreen from "./screens/FormattingScreen";

function bookWords(book: Book): number {
  return book.chapters.reduce((n, c) => n + countWords(c.content), 0);
}

export default function App() {
  const screen = useStore((s) => s.screen);
  const recordWords = useStore((s) => s.recordWords);
  const replaceSettings = useSettingsStore((s) => s.replace);
  const spellCheck = useSettingsStore((s) => s.spellCheck);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const lineHeight = useSettingsStore((s) => s.lineHeight);
  const paragraphSpacing = useSettingsStore((s) => s.paragraphSpacing);

  const settingsFirstRender = useRef(true);
  const spellFirstRender = useRef(true);

  useEffect(() => {
    void initSession().catch(() => undefined);
  }, []);

  useEffect(() => {
    const offMenu = window.glyphbook.onMenuCommand(handleMenuCommand);
    const offClose = window.glyphbook.onConfirmClose(() => {
      if (confirmCloseAllowed()) {
        void window.glyphbook.allowClose();
      }
    });
    return () => {
      offMenu();
      offClose();
    };
  }, []);

  useEffect(() => {
    let previous = shelfPaths();
    const unsub = useStore.subscribe(() => {
      const current = shelfPaths();
      if (current !== previous) {
        previous = current;
        void window.glyphbook.persistShelf(current ? current.split("|") : []);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    let alive = true;
    void window.glyphbook.loadSettings().then((settings) => {
      if (alive) replaceSettings(settings);
    });
    return () => {
      alive = false;
    };
  }, [replaceSettings]);

  useEffect(() => {
    const unsub = useStore.subscribe((state, prev) => {
      const id = state.activeBookId;
      if (!id) return;
      const prevBook = prev.books.find((b) => b.id === id);
      const book = state.books.find((b) => b.id === id);
      if (!prevBook || !book) return;
      const delta = bookWords(book) - bookWords(prevBook);
      if (delta > 0) recordWords(id, delta);
    });
    return unsub;
  }, [recordWords]);

  useEffect(() => {
    if (settingsFirstRender.current) {
      settingsFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void window.glyphbook.saveSettings({
        fontFamily,
        fontSize,
        lineHeight,
        paragraphSpacing,
        spellCheck,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [fontFamily, fontSize, lineHeight, paragraphSpacing, spellCheck]);

  useEffect(() => {
    if (spellFirstRender.current) {
      spellFirstRender.current = false;
      return;
    }
    void window.glyphbook.setSpellCheck(spellCheck);
  }, [spellCheck]);

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <TopBar />
      <main className="min-h-0 flex-1">
        {screen === "library" && <LibraryScreen />}
        {screen === "writing" && <WritingScreen />}
        {screen === "formatting" && <FormattingScreen />}
      </main>
    </div>
  );
}
