import { Heart, Plus } from "lucide-react";
import { useStore } from "../state/store";

const PRESET_THEMES = [
  { name: "Finch", family: "serif", accent: "#7a6a53" },
  { name: "Minerva", family: "serif", accent: "#5b6d6d" },
  { name: "Clairmont", family: "serif", accent: "#8a5a44" },
  { name: "Titus", family: "serif", accent: "#4a4a52" },
  { name: "Seraphina", family: "script", accent: "#96606b" },
  { name: "Intratech", family: "sans", accent: "#3f5566" },
  { name: "Bonkers Books", family: "sans", accent: "#c0654a" },
  { name: "Scarlett", family: "script", accent: "#a23a4a" },
];

export default function FormattingScreen() {
  const setScreen = useStore((s) => s.setScreen);
  const activeBookId = useStore((s) => s.activeBookId);
  const books = useStore((s) => s.books);
  const book = books.find((b) => b.id === activeBookId);

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Themes</h1>
            <p className="text-sm text-muted">
              Choose a preset theme or design your own.{" "}
              {book ? `Formatting ${book.title}.` : ""}
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
            <Plus className="h-4 w-4" /> Create a New Theme
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {PRESET_THEMES.map((t) => (
            <div
              key={t.name}
              className="cursor-pointer rounded-lg border border-rule bg-white p-3 shadow-sm transition hover:shadow-md"
            >
              <div
                className="mb-3 flex aspect-[3/4] items-center justify-center rounded-md"
                style={{ backgroundColor: `${t.accent}1a` }}
              >
                <div className="w-2/3 rounded-sm bg-white/90 p-3 shadow-sm">
                  <div
                    className="mb-2 text-center text-[10px] font-semibold"
                    style={{ color: t.accent }}
                  >
                    Chapter One
                  </div>
                  <div
                    className="space-y-1"
                    style={{ fontFamily: t.family }}
                  >
                    <div className="h-1 rounded bg-ink/20" />
                    <div className="h-1 rounded bg-ink/20" />
                    <div className="h-1 w-2/3 rounded bg-ink/20" />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="truncate text-sm font-medium">{t.name}</span>
                <button
                  className="ml-auto rounded p-1 text-muted hover:text-accent"
                  title="Favorite theme"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 rounded-md border border-rule bg-chrome p-3 text-xs text-muted">
          Formatting engine coming in a later milestone. From here you will
          customize themes, set trim size and layout, preview on devices, and
          export ePub / PDF.{" "}
          <button
            className="font-medium text-accent underline"
            onClick={() => setScreen("writing")}
          >
            Return to Writing
          </button>{" "}
          for now.
        </p>
      </div>

      <aside className="flex w-72 shrink-0 flex-col border-l border-rule bg-chrome">
        <div className="border-b border-rule px-3 py-2 text-sm font-medium">
          Preview
        </div>
        <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-muted">
          Device previews and page count will render here once the formatting
          pipeline lands.
        </div>
      </aside>
    </div>
  );
}
