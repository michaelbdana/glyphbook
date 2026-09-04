import { BookOpen, HelpCircle, Save } from "lucide-react";
import { useStore, isBookDirty } from "../state/store";
import { saveActiveBook } from "../state/session";

export default function TopBar() {
  const screen = useStore((s) => s.screen);
  const setScreen = useStore((s) => s.setScreen);
  const books = useStore((s) => s.books);
  const activeBookId = useStore((s) => s.activeBookId);
  const filePaths = useStore((s) => s.filePaths);
  const revision = useStore((s) => s.revision);
  const savedRevision = useStore((s) => s.savedRevision);

  const active =
    screen === "library" || screen === "writing" || screen === "formatting";
  const dirty = isBookDirty(revision, savedRevision, activeBookId);
  const filePath = activeBookId ? filePaths[activeBookId] : undefined;

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

      <div className="ml-auto flex items-center gap-2 text-muted">
        {activeBookId ? (
          <>
            <span className="max-w-[220px] truncate text-xs" title={filePath}>
              {filePath ? filePath.split(/[/\\]/).pop() : ""}
            </span>
            <button
              onClick={() => void saveActiveBook()}
              disabled={!dirty}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                dirty
                  ? "border-accent bg-accent text-white hover:bg-accent-hover"
                  : "border-rule bg-white"
              }`}
              title={dirty ? "Save changes (⌘/Ctrl+S)" : "All changes saved"}
            >
              <Save className="h-3.5 w-3.5" /> Save
            </button>
          </>
        ) : null}
        {activeBookId ? (
          <span
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
              dirty ? "text-amber-600" : "text-green-700"
            }`}
            title="Saved to your book file"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                dirty ? "animate-pulse bg-amber-500" : "bg-green-600"
              }`}
            />
            {dirty ? "Unsaved changes" : "Saved"}
          </span>
        ) : (
          <span className="text-xs text-muted">No book open</span>
        )}
        <button className="rounded p-1.5 hover:bg-chrome-dark" title="Help">
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
