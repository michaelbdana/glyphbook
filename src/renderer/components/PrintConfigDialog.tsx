import { useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import type {
  BookPrint,
  HeaderBox,
  PrintInk,
  PrintPaper,
} from "../../shared/model/prints";
import {
  HEADER_MACROS,
  printKindLabel,
  trimOptions,
} from "../../shared/model/prints";
import type { BookTheme } from "../../shared/model/theme";

const SIDE_KEYS = ["left", "center", "right"] as const;
type Side = (typeof SIDE_KEYS)[number];

function emptyBox(): HeaderBox {
  return { text: "" };
}

function boxFrom(value: HeaderBox | undefined): HeaderBox {
  return value
    ? { text: value.text, bold: value.bold, italic: value.italic, underline: value.underline }
    : emptyBox();
}

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

  const initialHf = print.headerFooter;
  const [boxes, setBoxes] = useState<{
    header: Record<Side, HeaderBox>;
    footer: Record<Side, HeaderBox>;
  }>({
    header: {
      left: boxFrom(initialHf?.header?.left),
      center: boxFrom(initialHf?.header?.center),
      right: boxFrom(initialHf?.header?.right),
    },
    footer: {
      left: boxFrom(initialHf?.footer?.left),
      center: boxFrom(initialHf?.footer?.center),
      right: boxFrom(initialHf?.footer?.right),
    },
  });

  const updateBox = (
    section: "header" | "footer",
    side: Side,
    patch: Partial<HeaderBox>,
  ) => {
    setBoxes((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [side]: { ...prev[section][side], ...patch },
      },
    }));
  };

  const number = (value: string, fallback: number): number => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const trims = trimOptions(print.kind);
  const chosenTrimIndex = trims.findIndex(
    (t) => Math.abs(t.widthIn - number(trimW, 0)) < 0.001 && Math.abs(t.heightIn - number(trimH, 0)) < 0.001,
  );

  const commit = () => {
    const hf: BookPrint["headerFooter"] = {};
    const sideHas = (section: "header" | "footer") =>
      SIDE_KEYS.some((side) => boxes[section][side].text.trim().length > 0);
    if (sideHas("header")) {
      hf.header = {};
      for (const side of SIDE_KEYS) {
        const box = boxes.header[side];
        if (box.text.trim().length > 0) {
          hf.header[side] = {
            text: box.text,
            bold: box.bold || undefined,
            italic: box.italic || undefined,
            underline: box.underline || undefined,
          };
        }
      }
    }
    if (sideHas("footer")) {
      hf.footer = {};
      for (const side of SIDE_KEYS) {
        const box = boxes.footer[side];
        if (box.text.trim().length > 0) {
          hf.footer[side] = {
            text: box.text,
            bold: box.bold || undefined,
            italic: box.italic || undefined,
            underline: box.underline || undefined,
          };
        }
      }
    }
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
      headerFooter:
        hf.header || hf.footer
          ? hf
          : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="flex max-h-[90vh] w-[880px] flex-col rounded-lg border border-rule bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold">{printKindLabel(print.kind)} Setup</h2>
            <p className="text-xs text-muted">Stored with this book; used by the Print PDF export.</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted hover:bg-chrome" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-6 gap-y-4 overflow-y-auto px-6 py-5">
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

          {(["header", "footer"] as const).map((section) => (
            <div key={section} className="col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-semibold capitalize">{section}</span>
                <span className="rounded bg-chrome-dark px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                  Print only
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {SIDE_KEYS.map((side) => {
                  const box = boxes[section][side];
                  return (
                    <div key={side} className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        {side}
                      </span>
                      <input
                        value={box.text}
                        onChange={(e) => updateBox(section, side, { text: e.target.value })}
                        placeholder="Text or {page} {chapter} …"
                        className={`${inputClass} w-full`}
                      />
                      <div className="flex flex-wrap items-center gap-1">
                        {HEADER_MACROS.map((m) => (
                          <button
                            key={m.token}
                            onClick={() =>
                              updateBox(section, side, { text: `${box.text}${m.token}` })
                            }
                            title={`Insert ${m.label}`}
                            className="rounded border border-rule px-1.5 py-0.5 font-mono text-[10px] text-muted hover:bg-chrome"
                          >
                            {m.token}
                          </button>
                        ))}
                        <span className="mx-1 h-4 w-px bg-rule" />
                        {(
                          [
                            ["bold", "B"],
                            ["italic", "I"],
                            ["underline", "U"],
                          ] as const
                        ).map(([key, letter]) => (
                          <button
                            key={key}
                            onClick={() =>
                              updateBox(section, side, { [key]: !box[key] })
                            }
                            className={`rounded px-2 py-0.5 text-xs font-bold ${
                              box[key]
                                ? "bg-accent text-white"
                                : "border border-rule text-muted hover:bg-chrome"
                            }`}
                          >
                            {letter}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
