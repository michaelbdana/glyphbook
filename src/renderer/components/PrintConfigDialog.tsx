import { useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { BookPrint, PrintInk, PrintPaper } from "../../shared/model/prints";
import { printKindLabel, trimOptions } from "../../shared/model/prints";
import type { BookTheme } from "../../shared/model/theme";

type Props = {
  print: BookPrint;
  baseTheme: BookTheme;
  onSave: (print: BookPrint) => void;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-md border border-rule px-2 py-1.5 outline-none focus:border-accent";

const INK_OPTIONS: { value: PrintInk; label: string }[] = [
  { value: "bw", label: "Black & white" },
  { value: "standardColor", label: "Standard color" },
  { value: "premiumColor", label: "Premium color" },
];

const PAPER_OPTIONS: { value: PrintPaper; label: string }[] = [
  { value: "white", label: "White" },
  { value: "cream", label: "Cream" },
  { value: "groundwood", label: "Groundwood" },
];

export default function PrintConfigDialog({ print, baseTheme, onSave, onClose }: Props) {
  const [label, setLabel] = useState(print.label);
  const [trimW, setTrimW] = useState(String(print.trimWidthIn));
  const [trimH, setTrimH] = useState(String(print.trimHeightIn));
  const [bleed, setBleed] = useState(print.bleed);
  const [ink, setInk] = useState<PrintInk>(print.ink);
  const [paper, setPaper] = useState<PrintPaper>(print.paper);
  const [inside, setInside] = useState(String(print.marginInsideIn));
  const [outside, setOutside] = useState(String(print.marginOutsideIn));
  const [top, setTop] = useState(String(print.marginTopIn));
  const [bottom, setBottom] = useState(String(print.marginBottomIn));
  const [fontSize, setFontSize] = useState(
    String(print.fontSizePt ?? baseTheme.bodyFontSizePt),
  );
  const [lineHeight, setLineHeight] = useState(
    String(print.lineHeight ?? baseTheme.lineHeight),
  );
  const [justify, setJustify] = useState(print.justify ?? baseTheme.justify);

  const number = (value: string, fallback: number): number => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const trims = trimOptions(print.kind);
  const chosenTrimIndex = trims.findIndex(
    (t) => Math.abs(t.widthIn - number(trimW, 0)) < 0.001 && Math.abs(t.heightIn - number(trimH, 0)) < 0.001,
  );

  const commit = () => {
    onSave({
      ...print,
      label: label.trim() || printKindLabel(print.kind),
      trimWidthIn: number(trimW, print.trimWidthIn),
      trimHeightIn: number(trimH, print.trimHeightIn),
      bleed,
      ink,
      paper,
      marginInsideIn: number(inside, print.marginInsideIn),
      marginOutsideIn: number(outside, print.marginOutsideIn),
      marginTopIn: number(top, print.marginTopIn),
      marginBottomIn: number(bottom, print.marginBottomIn),
      fontSizePt: number(fontSize, baseTheme.bodyFontSizePt),
      lineHeight: number(lineHeight, baseTheme.lineHeight),
      justify,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="flex max-h-[85vh] w-[560px] flex-col rounded-lg border border-rule bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold">{printKindLabel(print.kind)} Setup</h2>
            <p className="text-xs text-muted">Stored with this book; used by the Print PDF export.</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted hover:bg-chrome" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 overflow-y-auto px-5 py-4">
          <Field label="Version name">
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Trim size">
            <select
              value={chosenTrimIndex === -1 ? "custom" : String(chosenTrimIndex)}
              onChange={(e) => {
                const t = trims[Number(e.target.value)];
                if (t) {
                  setTrimW(String(t.widthIn));
                  setTrimH(String(t.heightIn));
                }
              }}
              className={inputClass}
            >
              {trims.map((t, i) => (
                <option key={t.label} value={i}>
                  {t.label}
                </option>
              ))}
              {chosenTrimIndex === -1 && (
                <option value="custom">Custom {trimW} × {trimH}</option>
              )}
            </select>
          </Field>
          <Field label="Width (in)">
            <input value={trimW} onChange={(e) => setTrimW(e.target.value)} type="number" step="any" className={inputClass} />
          </Field>
          <Field label="Height (in)">
            <input value={trimH} onChange={(e) => setTrimH(e.target.value)} type="number" step="any" className={inputClass} />
          </Field>

          <Field label="Inside (gutter) margin">
            <input value={inside} onChange={(e) => setInside(e.target.value)} type="number" step="any" className={inputClass} />
          </Field>
          <Field label="Outside margin">
            <input value={outside} onChange={(e) => setOutside(e.target.value)} type="number" step="any" className={inputClass} />
          </Field>
          <Field label="Top margin">
            <input value={top} onChange={(e) => setTop(e.target.value)} type="number" step="any" className={inputClass} />
          </Field>
          <Field label="Bottom margin">
            <input value={bottom} onChange={(e) => setBottom(e.target.value)} type="number" step="any" className={inputClass} />
          </Field>

          <Field label="Body font size (pt)">
            <input value={fontSize} onChange={(e) => setFontSize(e.target.value)} type="number" step="0.5" className={inputClass} />
          </Field>
          <Field label="Line height">
            <input value={lineHeight} onChange={(e) => setLineHeight(e.target.value)} type="number" step="0.1" className={inputClass} />
          </Field>

          <Field label="Ink">
            <select value={ink} onChange={(e) => setInk(e.target.value as PrintInk)} className={inputClass}>
              {INK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Paper">
            <select value={paper} onChange={(e) => setPaper(e.target.value as PrintPaper)} className={inputClass}>
              {PAPER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bleed} onChange={(e) => setBleed(e.target.checked)} />
              Bleed (adds 0.125″ beyond trim on top, bottom, outside)
            </label>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={justify} onChange={(e) => setJustify(e.target.checked)} />
              Justify text
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-rule px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-rule px-4 py-1.5 text-sm font-medium hover:bg-chrome">
            Cancel
          </button>
          <button onClick={commit} className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover">
            Save {printKindLabel(print.kind)}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
    </label>
  );
}
