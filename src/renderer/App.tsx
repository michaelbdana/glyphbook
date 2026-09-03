import { useEffect, useRef } from "react";
import { useStore } from "./state/store";
import TopBar from "./components/TopBar";
import LibraryScreen from "./screens/LibraryScreen";
import WritingScreen from "./screens/WritingScreen";
import FormattingScreen from "./screens/FormattingScreen";

export default function App() {
  const screen = useStore((s) => s.screen);
  const books = useStore((s) => s.books);
  const loadBooks = useStore((s) => s.loadBooks);
  const setSaveState = useStore((s) => s.setSaveState);

  const firstRender = useRef(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const loaded = await window.glyphbook.loadLibrary();
        if (alive && loaded !== null) {
          loadBooks(loaded);
        }
      } catch {
        // first run with no library file on disk
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadBooks]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setSaveState("saving");
      void window.glyphbook
        .saveLibrary(books)
        .catch(() => undefined)
        .finally(() => setSaveState("saved"));
    }, 800);
    return () => clearTimeout(timer);
  }, [books, setSaveState]);

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
