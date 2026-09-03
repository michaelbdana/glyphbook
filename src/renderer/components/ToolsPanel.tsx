import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useStore, type ToolId } from "../state/store";
import { useSettingsStore } from "../state/settingsStore";
import { findInBook, replaceInBook } from "../../shared/services/findReplace";
import { transformDoc } from "../../shared/services/smartQuotes";
import { computePlan, computeStreak } from "../../shared/services/goals";

const FONT_OPTIONS = [
  { label: "Serif", value: "Georgia, 'Liberation Serif', 'Noto Serif', serif" },
  {
    label: "Sans-serif",
    value: "'Helvetica Neue', 'Noto Sans', 'Liberation Sans', sans-serif",
  },
  { label: "Monospace", value: "'Courier New', 'Liberation Mono', monospace" },
];

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const TABS: { id: ToolId; label: string }[] = [
  { id: "find", label: "Find & Replace" },
  { id: "goals", label: "Goals" },
  { id: "sprint", label: "Sprint" },
  { id: "quotes", label: "Smart Quotes" },
  { id: "editor", label: "Editor" },
];

function FindTab() {
  const book = useStore((s) => s.books.find((b) => b.id === s.activeBookId));
  const setBookChapters = useStore((s) => s.setBookChapters);
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const matches = useMemo(
    () => (book && query ? findInBook(book, query, { caseSensitive }) : []),
    [book, query, caseSensitive],
  );
  const total = matches.reduce((n, m) => n + m.count, 0);

  const doReplace = () => {
    if (!book || !query) return;
    const result = replaceInBook(book, query, replacement, { caseSensitive });
    if (result.replaced > 0) {
      setBookChapters(result.chapters);
      setMessage(`Replaced ${result.replaced} occurrence(s).`);
    } else {
      setMessage("No matches found.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Find</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-rule px-3 py-1.5 outline-none focus:border-accent"
          autoFocus
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Replace with</label>
        <input
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          className="w-full rounded-md border border-rule px-3 py-1.5 outline-none focus:border-accent"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
        />
        Case sensitive
      </label>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          {query
            ? `${total} match(es) in ${matches.length} chapter(s)`
            : "Type a phrase to search the whole book."}
        </span>
        <button
          onClick={doReplace}
          disabled={!query}
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          Replace All
        </button>
      </div>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {total > 0 && (
        <ul className="max-h-40 overflow-y-auto rounded-md border border-rule bg-chrome p-2 text-sm">
          {matches.map((m) => (
            <li key={m.chapterId} className="flex justify-between py-0.5">
              <span className="truncate pr-3">{m.title}</span>
              <span className="text-muted">{m.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GoalsTab() {
  const book = useStore((s) => s.books.find((b) => b.id === s.activeBookId));
  const updateBook = useStore((s) => s.updateBook);

  const [targetWords, setTargetWords] = useState(
    String(book?.goals?.targetWords ?? ""),
  );
  const [dueDate, setDueDate] = useState(book?.goals?.dueDate ?? "");
  const [goalDays, setGoalDays] = useState<number[]>(
    book?.goals?.writingDays ?? [],
  );
  const [dailyWords, setDailyWords] = useState(
    String(book?.habit?.dailyWords ?? ""),
  );
  const [habitDays, setHabitDays] = useState<number[]>(
    book?.habit?.writingDays ?? [],
  );

  if (!book) return null;

  const words = book.chapters.reduce(
    (n, c) => n + countDoc(c.content),
    0,
  );

  const plan = computePlan(
    {
      targetWords: Number(targetWords) || undefined,
      dueDate: dueDate || undefined,
      writingDays: goalDays,
    },
    words,
  );
  const streak = computeStreak(book.habitLog, {
    dailyWords: Number(dailyWords) || undefined,
    writingDays: habitDays,
  });

  const toggleDay = (days: number[], day: number): number[] =>
    days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort();

  const save = () => {
    updateBook(book.id, {
      goals: {
        targetWords: Number(targetWords) || undefined,
        dueDate: dueDate || undefined,
        writingDays: goalDays,
      },
      habit: {
        dailyWords: Number(dailyWords) || undefined,
        writingDays: habitDays,
      },
    });
  };

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-semibold">Book Goal</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Target words</span>
            <input
              type="number"
              min={0}
              value={targetWords}
              onChange={(e) => setTargetWords(e.target.value)}
              className="w-full rounded-md border border-rule px-3 py-1.5 outline-none focus:border-accent"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-rule px-3 py-1.5 outline-none focus:border-accent"
            />
          </label>
        </div>
        <div className="mt-3 text-sm">
          <span className="text-muted">Writing days</span>
          <div className="mt-1 flex gap-1">
            {DAY_LABELS.map((label, day) => (
              <button
                key={day}
                onClick={() => setGoalDays((d) => toggleDay(d, day))}
                className={`h-8 w-8 rounded-md border text-xs font-medium ${
                  goalDays.includes(day)
                    ? "border-accent bg-accent text-white"
                    : "border-rule text-muted hover:bg-chrome-dark"
                }`}
                title={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-md bg-chrome p-3 text-sm text-muted">
          {words.toLocaleString()} words so far · {plan.percentComplete.toFixed(0)}% complete
          {plan.requiredPerWritingDay !== null &&
            ` · ${plan.requiredPerWritingDay.toLocaleString()} words/writing day needed`}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Writing Habit</h3>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Daily target words</span>
          <input
            type="number"
            min={0}
            value={dailyWords}
            onChange={(e) => setDailyWords(e.target.value)}
            className="w-full rounded-md border border-rule px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>
        <div className="mt-3 text-sm">
          <span className="text-muted">Habit days</span>
          <div className="mt-1 flex gap-1">
            {DAY_LABELS.map((label, day) => (
              <button
                key={day}
                onClick={() => setHabitDays((d) => toggleDay(d, day))}
                className={`h-8 w-8 rounded-md border text-xs font-medium ${
                  habitDays.includes(day)
                    ? "border-accent bg-accent text-white"
                    : "border-rule text-muted hover:bg-chrome-dark"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-md bg-chrome p-3 text-sm text-muted">
          {streak.wordsToday.toLocaleString()} words today
          {streak.goalMetToday ? " · daily goal met" : ""} ·{" "}
          {streak.currentStreak} day streak
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={save}
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Save Goals
        </button>
      </div>
    </div>
  );
}

function countDoc(doc: { content?: unknown[] }): number {
  let count = 0;
  const blocks = doc.content ?? [];
  for (const raw of blocks) {
    const block = raw as { type?: string; content?: unknown[] };
    if (block.type !== "paragraph" && block.type !== "heading") continue;
    for (const rawInline of block.content ?? []) {
      const inline = rawInline as { type?: string; text?: string };
      if (inline.type === "text" && inline.text) {
        count += inline.text.split(/\s+/).filter(Boolean).length;
      }
    }
  }
  return count;
}

function SprintTab() {
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r === null || r <= 1) {
          setRunning(false);
          setDone(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const format = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const start = () => {
    setDone(false);
    if (remaining === null) setRemaining(minutes * 60);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setRemaining(null);
    setDone(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div
        className={`flex h-40 w-40 items-center justify-center rounded-full border-8 text-3xl font-semibold tabular-nums ${
          done
            ? "border-green-400 text-green-700"
            : "border-accent/30 text-ink"
        }`}
      >
        {remaining === null ? format(minutes * 60) : format(remaining)}
      </div>
      {done && <p className="text-sm font-medium text-green-700">Sprint complete!</p>}
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted">Duration</span>
        <select
          value={minutes}
          onChange={(e) => {
            setMinutes(Number(e.target.value));
            setRemaining(null);
          }}
          disabled={running}
          className="rounded-md border border-rule px-2 py-1"
        >
          {[5, 10, 15, 20, 25, 30, 45, 50, 60].map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        {!running ? (
          <button
            onClick={start}
            className="rounded-md bg-accent px-5 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Start
          </button>
        ) : (
          <button
            onClick={() => setRunning(false)}
            className="rounded-md border border-rule px-5 py-1.5 text-sm font-medium hover:bg-chrome"
          >
            Pause
          </button>
        )}
        <button
          onClick={reset}
          className="rounded-md border border-rule px-5 py-1.5 text-sm font-medium hover:bg-chrome"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function QuotesTab() {
  const book = useStore((s) => s.books.find((b) => b.id === s.activeBookId));
  const setBookChapters = useStore((s) => s.setBookChapters);
  const [message, setMessage] = useState<string | null>(null);

  const apply = () => {
    if (!book) return;
    let total = 0;
    const chapters = book.chapters.map((chapter) => {
      const result = transformDoc(chapter.content);
      total += result.count;
      return result.count > 0
        ? { ...chapter, content: result.doc }
        : chapter;
    });
    setBookChapters(chapters);
    setMessage(
      total > 0
        ? `Converted ${total} straight quote(s) to smart quotes.`
        : "No straight quotes to convert.",
    );
  };

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-muted">
        Converts straight quotes and apostrophes across the whole book into
        typographic curly quotes (“ ” ‘ ’), chapter by chapter.
      </p>
      <button
        onClick={apply}
        className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Apply Smart Quotes
      </button>
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}

function EditorTab() {
  const settings = useSettingsStore();
  const setFontFamily = useSettingsStore((s) => s.setFontFamily);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const setLineHeight = useSettingsStore((s) => s.setLineHeight);
  const setParagraphSpacing = useSettingsStore((s) => s.setParagraphSpacing);
  const setSpellCheck = useSettingsStore((s) => s.setSpellCheck);

  return (
    <div className="space-y-4 py-1">
      <p className="text-xs text-muted">
        These affect the writing editor only — they never change how your book
        is formatted or exported.
      </p>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Font</span>
        <select
          value={settings.fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="w-full rounded-md border border-rule px-3 py-1.5"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Font size</span>
          <select
            value={settings.fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full rounded-md border border-rule px-3 py-1.5"
          >
            {[12, 14, 16, 18, 20, 22].map((size) => (
              <option key={size} value={size}>
                {size} px
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Line height</span>
          <select
            value={settings.lineHeight}
            onChange={(e) => setLineHeight(Number(e.target.value))}
            className="w-full rounded-md border border-rule px-3 py-1.5"
          >
            {[1.2, 1.4, 1.6, 1.8, 2.0, 2.2].map((lh) => (
              <option key={lh} value={lh}>
                {lh}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="text-sm">
        <span className="mb-1 block font-medium">Paragraphs</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="paragraphs"
              checked={settings.paragraphSpacing === "indent"}
              onChange={() => setParagraphSpacing("indent")}
            />
            Indented
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="paragraphs"
              checked={settings.paragraphSpacing === "spaced"}
              onChange={() => setParagraphSpacing("spaced")}
            />
            Spaced
          </label>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.spellCheck}
          onChange={(e) => setSpellCheck(e.target.checked)}
        />
        Spell check
      </label>
    </div>
  );
}

export default function ToolsPanel() {
  const tool = useStore((s) => s.tool);
  const openTool = useStore((s) => s.openTool);
  const closeTool = useStore((s) => s.closeTool);

  if (!tool) return null;

  const tab = TABS.find((t) => t.id === tool) ?? TABS[0];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
      onClick={closeTool}
    >
      <div
        className="flex max-h-[80vh] w-[600px] flex-col rounded-lg border border-rule bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rule px-4 py-2">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => openTool(t.id)}
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  t.id === tab.id
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-chrome"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={closeTool}
            className="rounded p-1 text-muted hover:bg-chrome"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {tab.id === "find" && <FindTab />}
          {tab.id === "goals" && <GoalsTab />}
          {tab.id === "sprint" && <SprintTab />}
          {tab.id === "quotes" && <QuotesTab />}
          {tab.id === "editor" && <EditorTab />}
        </div>
      </div>
    </div>
  );
}
