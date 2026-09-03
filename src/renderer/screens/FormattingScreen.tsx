import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Calculator, Check, FileDown, Palette, RotateCcw } from "lucide-react";
import { useStore } from "../state/store";
import BookPreview from "../components/BookPreview";
import ImageCalcDialog from "../components/ImageCalcDialog";
import {
  FONT_FAMILIES,
  HEADING_FAMILIES,
  THEME_PRESETS,
  TRIM_SIZES,
  mergeTheme,
  trimLabel,
  type BookTheme,
  type ParagraphStart,
  type FirstParagraph,
  type LayoutPriority,
  type NotesPlacement,
  type PageNumberLocation,
  type RunningHeader,
} from "../../shared/model/theme";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

const selectClass =
  "w-full rounded-md border border-rule px-2 py-1.5 outline-none focus:border-accent";
const inputClass =
  "w-full rounded-md border border-rule px-2 py-1.5 outline-none focus:border-accent";

export default function FormattingScreen() {
  const books = useStore((s) => s.books);
  const activeBookId = useStore((s) => s.activeBookId);
  const updateBook = useStore((s) => s.updateBook);
  const setScreen = useStore((s) => s.setScreen);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState<string | null>(null);

  const book = books.find((b) => b.id === activeBookId);

  const effectiveTheme = useMemo(
    () => (book ? mergeTheme(book.themeName, book.theme) : null),
    [book],
  );

  if (!book || !effectiveTheme) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        No book open. Open a book from My Books, then return here to format it.
      </div>
    );
  }

  const applyPreset = (id: string) => {
    updateBook(book.id, { themeName: id, theme: undefined });
  };

  const applyOverride = (theme: BookTheme) => {
    updateBook(book.id, { theme });
  };

  const exportFile = (kind: "epub" | "pdf" | "docx") => {
    if (exportBusy) return;
    setExportBusy(kind);
    const job =
      kind === "epub"
        ? window.glyphbook.exportEpub(book)
        : kind === "docx"
          ? window.glyphbook.exportDocx(book)
          : window.glyphbook.exportPdf(book).then(() => undefined);
    void job.finally(() => setExportBusy(null));
  };

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Theme & Page Setup</h1>
            <p className="text-sm text-muted">
              {book.title} · {trimLabel(effectiveTheme)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCalcOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-rule bg-white px-4 py-2 text-sm font-medium hover:bg-chrome"
              title="Calculate image pixel sizes for print and eBook"
            >
              <Calculator className="h-4 w-4" /> Image Size
            </button>
            <button
              onClick={() => setBuilderOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <Palette className="h-4 w-4" /> Customize Theme
            </button>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-lg border border-rule bg-white p-2">
          <FileDown className="h-4 w-4 text-muted" />
          <span className="mr-1 text-sm font-medium">Export</span>
          {(["pdf", "epub", "docx"] as const).map((kind) => (
            <button
              key={kind}
              onClick={() => exportFile(kind)}
              disabled={exportBusy !== null}
              className="rounded-md border border-rule px-3 py-1 text-xs font-medium uppercase disabled:opacity-50"
              title={`Export ${kind.toUpperCase()} to your exports folder`}
            >
              {exportBusy === kind ? "Working…" : kind}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted">
            ePub & PDF are publish-ready · DOCX for sharing/backup
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {THEME_PRESETS.map((preset) => {
            const active = (book.themeName ?? "finch") === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`relative rounded-lg border bg-white p-3 text-left shadow-sm transition hover:shadow-md ${
                  active ? "border-accent ring-1 ring-accent" : "border-rule"
                }`}
              >
                <div className="mb-2 rounded-md bg-chrome px-2 py-1 text-center text-[10px] font-semibold" style={{ fontFamily: preset.theme.headingFontFamily }}>
                  Chapter One
                </div>
                <div
                  className="mb-2 space-y-1 text-[9px] leading-relaxed"
                  style={{
                    fontFamily: preset.theme.bodyFontFamily,
                    textAlign: preset.theme.justify ? "justify" : "left",
                  }}
                >
                  <p className="mb-1 line-clamp-2">
                    The wind arrived before the rain did, tearing across the
                    headland in long, hungry gusts.
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="truncate text-sm font-medium">
                    {preset.name}
                  </span>
                  {active && (
                    <span className="ml-auto rounded-full bg-accent p-0.5 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-md border border-rule bg-chrome p-3 text-xs text-muted">
          <button
            className="font-medium text-accent underline"
            onClick={() => setScreen("writing")}
          >
            Return to Writing
          </button>{" "}
          to keep editing. Changes here apply to the print/ePub export pipeline
          immediately.
        </div>
      </div>

      <aside className="flex w-[430px] shrink-0 flex-col border-l border-rule bg-chrome">
        <BookPreview book={book} showPrint initial="print" />
      </aside>

      {builderOpen && (
        <ThemeBuilder
          bookTitle={book.title}
          initial={effectiveTheme}
          onSave={(theme) => {
            applyOverride(theme);
            setBuilderOpen(false);
          }}
          onClose={() => setBuilderOpen(false)}
        />
      )}

      {calcOpen && (
        <ImageCalcDialog
          trimWidthIn={effectiveTheme.trimWidthIn}
          trimHeightIn={effectiveTheme.trimHeightIn}
          insideMarginIn={effectiveTheme.marginInsideIn}
          outsideMarginIn={effectiveTheme.marginOutsideIn}
          onClose={() => setCalcOpen(false)}
        />
      )}
    </div>
  );
}

function ThemeBuilder({
  bookTitle,
  initial,
  onSave,
  onClose,
}: {
  bookTitle: string;
  initial: BookTheme;
  onSave: (theme: BookTheme) => void;
  onClose: () => void;
}) {
  const [t, setT] = useState<BookTheme>({ ...initial });
  const set = (patch: Partial<BookTheme>) => setT((v) => ({ ...v, ...patch }));

  const familyCss = (id: string, list: { id: string; css: string }[]) =>
    list.find((f) => f.css === id)?.css ?? list[0].css;

  const bodyFamily = (css: string) =>
    FONT_FAMILIES.find((f) => f.css === css) ?? FONT_FAMILIES[0];
  const headingFamily = (css: string) =>
    HEADING_FAMILIES.find((f) => f.css === css) ?? HEADING_FAMILIES[0];

  const number = (v: string, fallback: number): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[680px] flex-col rounded-lg border border-rule bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <h2 className="text-lg font-semibold">Customize Theme</h2>
          <button
            onClick={() => set({ ...initial })}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted hover:bg-chrome"
            title="Reset to the preset defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto px-5 py-4">
          <div className="col-span-2 text-xs text-muted">
            These settings drive the print PDF and preview. ({bookTitle})
          </div>

          <Field label="Body font">
            <select
              value={bodyFamily(t.bodyFontFamily).id}
              onChange={(e) =>
                set({ bodyFontFamily: familyCss(e.target.value, FONT_FAMILIES) })
              }
              className={selectClass}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Chapter heading font">
            <select
              value={headingFamily(t.headingFontFamily).id}
              onChange={(e) =>
                set({ headingFontFamily: familyCss(e.target.value, HEADING_FAMILIES) })
              }
              className={selectClass}
            >
              {HEADING_FAMILIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Body font size (pt)">
            <input
              type="number"
              step={0.5}
              value={t.bodyFontSizePt}
              onChange={(e) => set({ bodyFontSizePt: number(e.target.value, 11.5) })}
              className={inputClass}
            />
          </Field>
          <Field label="Line height">
            <input
              type="number"
              step={0.1}
              value={t.lineHeight}
              onChange={(e) => set({ lineHeight: number(e.target.value, 1.45) })}
              className={inputClass}
            />
          </Field>

          <Field label="Heading size (pt)">
            <input
              type="number"
              step={0.5}
              value={t.headingFontSizePt}
              onChange={(e) => set({ headingFontSizePt: number(e.target.value, 18) })}
              className={inputClass}
            />
          </Field>
          <Field label="First line of chapter">
            <select
              value={t.firstParagraph}
              onChange={(e) =>
                set({ firstParagraph: e.target.value as FirstParagraph })
              }
              className={selectClass}
            >
              <option value="none">Plain paragraph</option>
              <option value="dropCap">Drop cap</option>
              <option value="leadIn">Lead-in small caps</option>
              <option value="both">Drop cap + small caps</option>
            </select>
          </Field>

          <Field label="Trim size">
            <select
              value={TRIM_SIZES.findIndex(
                (s) => s.widthIn === t.trimWidthIn && s.heightIn === t.trimHeightIn,
              ).toString()}
              onChange={(e) => {
                const size = TRIM_SIZES[Number(e.target.value)];
                set({ trimWidthIn: size.widthIn, trimHeightIn: size.heightIn });
              }}
              className={selectClass}
            >
              {TRIM_SIZES.map((s, i) => (
                <option key={s.label} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Paragraph start">
            <select
              value={t.paragraphStart}
              onChange={(e) =>
                set({ paragraphStart: e.target.value as ParagraphStart })
              }
              className={selectClass}
            >
              <option value="indent">Indent first line</option>
              <option value="spaced">Space between paragraphs</option>
            </select>
          </Field>

          <Field label="Layout priority">
            <select
              value={t.layoutPriority}
              onChange={(e) =>
                set({ layoutPriority: e.target.value as LayoutPriority })
              }
              className={selectClass}
            >
              <option value="bestOfBoth">Best of both</option>
              <option value="widowOrphans">Widows & orphans</option>
              <option value="balanced">Balanced pages</option>
            </select>
          </Field>
          <Field label="Scene break ornament">
            <input
              value={t.sceneBreakOrnament}
              onChange={(e) => set({ sceneBreakOrnament: e.target.value })}
              placeholder="e.g., * * *"
              className={inputClass}
            />
          </Field>

          <Field label="Page number">
            <select
              value={t.pageNumber}
              onChange={(e) =>
                set({ pageNumber: e.target.value as PageNumberLocation })
              }
              className={selectClass}
            >
              <option value="footer">Footer (bottom center)</option>
              <option value="header">Header (top center)</option>
              <option value="none">None</option>
            </select>
          </Field>
          <Field label="Running header">
            <select
              value={t.runningHeader}
              onChange={(e) =>
                set({ runningHeader: e.target.value as RunningHeader })
              }
              className={selectClass}
            >
              <option value="chapterTitle">Chapter title</option>
              <option value="bookTitle">Book title</option>
              <option value="none">None</option>
            </select>
          </Field>

          <Field label="Notes (print)">
            <select
              value={t.notesPrint}
              onChange={(e) => set({ notesPrint: e.target.value as NotesPlacement })}
              className={selectClass}
            >
              <option value="foot">Footnotes on the page</option>
              <option value="endChapter">End of chapter</option>
              <option value="endBook">End of book</option>
            </select>
          </Field>
          <Field label="Notes (eBook)">
            <select
              value={t.notesEbook}
              onChange={(e) => set({ notesEbook: e.target.value as NotesPlacement })}
              className={selectClass}
            >
              <option value="endChapter">End of chapter</option>
              <option value="endBook">End of book</option>
              <option value="foot">Footnotes</option>
            </select>
          </Field>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={t.justify}
                onChange={(e) => set({ justify: e.target.checked })}
              />
              Justify text
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={t.largePrint}
                onChange={(e) => set({ largePrint: e.target.checked })}
              />
              Large print
            </label>
          </div>
        </div>

        <div className="flex justify-between gap-2 border-t border-rule px-5 py-3">
          <div className="flex gap-3 text-xs text-muted">
            <span>
              Margins: inside {t.marginInsideIn}in · outside {t.marginOutsideIn}in
            </span>
            <span>
              top {t.marginTopIn}in · bottom {t.marginBottomIn}in
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-rule px-4 py-1.5 text-sm font-medium hover:bg-chrome"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(t)}
              className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Save Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
