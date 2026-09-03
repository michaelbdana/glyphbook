import { BookOpen, Check, HelpCircle, Loader2 } from "lucide-react";
import { useStore } from "../state/store";

export default function TopBar() {
  const screen = useStore((s) => s.screen);
  const setScreen = useStore((s) => s.setScreen);
  const books = useStore((s) => s.books);
  const saveState = useStore((s) => s.saveState);

  const active = screen === "library" || screen === "writing" || screen === "formatting";

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-rule bg-chrome px-3">
      <button
        onClick={() => setScreen("library")}
        className="flex items-center gap-2 rounded px-2 py-1 text-sm font-semibold hover:bg-chrome-dark"
        title="Home"
      >
        <BookOpen className="h-5 w-5 text-accent" />
        <span>Glyphbook</span>
      </button>

      {active && (
        <div className="mx-auto flex rounded-lg border border-rule bg-white p-0.5 text-sm shadow-sm">
          <button
            onClick={() => setScreen("library")}
            className={`rounded-md px-4 py-1 font-medium ${
              screen === "library" ? "bg-accent text-white" : "hover:bg-chrome-dark"
            }`}
          >
            My Books
          </button>
          <button
            onClick={() => setScreen("writing")}
            disabled={books.length === 0}
            className={`rounded-md px-4 py-1 font-medium disabled:opacity-40 ${
              screen === "writing" ? "bg-accent text-white" : "hover:bg-chrome-dark"
            }`}
          >
            Writing
          </button>
          <button
            onClick={() => setScreen("formatting")}
            disabled={books.length === 0}
            className={`rounded-md px-4 py-1 font-medium disabled:opacity-40 ${
              screen === "formatting" ? "bg-accent text-white" : "hover:bg-chrome-dark"
            }`}
          >
            Formatting
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1 text-muted">
        <span
          className="flex items-center gap-1 rounded px-2 py-1 text-xs"
          title="Saved locally to this computer"
        >
          {saveState === "saving" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {saveState === "saving" ? "Saving…" : "Saved"}
        </span>
        <button className="rounded p-1.5 hover:bg-chrome-dark" title="Help">
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
