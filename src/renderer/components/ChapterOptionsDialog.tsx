import { useState } from "react";
import type {
  Book,
  Chapter,
  ChapterKind,
  ChapterSection,
} from "../../shared/model/types";
import { DEFAULT_CHAPTER_OPTIONS, PRESETS } from "../../shared/model/presets";

type Props = {
  book: Book;
  chapter: Chapter;
  onSave: (patch: {
    options: Partial<Chapter["options"]>;
    partId?: string;
    volumeId?: string;
    section: ChapterSection;
    kind: ChapterKind;
  }) => void;
  onClose: () => void;
};

const SECTIONS: { value: ChapterSection; label: string }[] = [
  { value: "front", label: "Front Matter" },
  { value: "body", label: "Body" },
  { value: "back", label: "Back Matter" },
];

const KIND_OPTIONS: { value: ChapterKind; label: string }[] = (() => {
  const seen = new Set<ChapterKind>();
  const options: { value: ChapterKind; label: string }[] = [];
  const push = (value: ChapterKind, label: string) => {
    if (seen.has(value)) return;
    seen.add(value);
    options.push({ value, label });
  };
  push("page", "Plain Page");
  push("chapter", "Chapter");
  push("cover", "Cover Page");
  push("title", "Title Page");
  push("copyright", "Copyright Page");
  push("toc", "Table of Contents");
  push("dedication", "Dedication");
  push("epigraph", "Epigraph");
  push("prologue", "Prologue");
  push("epilogue", "Epilogue");
  push("foreword", "Foreword");
  push("preface", "Preface");
  push("introduction", "Introduction");
  push("blurbs", "Blurbs");
  push("afterword", "Afterword");
  push("acknowledgements", "Acknowledgements");
  push("about", "About the Author");
  push("alsoby", "Also By");
  push("fullpage", "Full Page Image");
  for (const preset of PRESETS) push(preset.key, preset.label);
  return options;
})();

const INCLUDE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "ebook", label: "eBook Only" },
  { value: "print", label: "Print Only" },
  { value: "none", label: "None" },
] as const;

const BEGIN_OPTIONS = [
  { value: "auto", label: "No preference" },
  { value: "right", label: "Right side" },
  { value: "left", label: "Left side" },
] as const;

const HIDE_FIELDS = [
  { key: "hideHeading", label: "Hide chapter heading" },
  { key: "hidePageNumber", label: "Hide page number" },
  { key: "hideHeaderFooter", label: "Hide header & footer" },
  { key: "hideToc", label: "Hide from Table of Contents" },
  { key: "smallerTitle", label: "Use smaller chapter title" },
  { key: "invertText", label: "Invert text color" },
] as const;

export default function ChapterOptionsDialog({
  book,
  chapter,
  onSave,
  onClose,
}: Props) {
  const current = { ...DEFAULT_CHAPTER_OPTIONS, ...(chapter.options ?? {}) };
  const [includeIn, setIncludeIn] = useState(current.includeIn);
  const [beginOn, setBeginOn] = useState(current.beginOn);
  const [hides, setHides] = useState<Record<string, boolean>>(
    Object.fromEntries(
      HIDE_FIELDS.map((f) => [f.key, current[f.key]]),
    ) as Record<string, boolean>,
  );
  const [volumeId, setVolumeId] = useState(chapter.volumeId ?? "");
  const [partId, setPartId] = useState(chapter.partId ?? "");
  const [section, setSection] = useState<ChapterSection>(chapter.section);
  const [kind, setKind] = useState<ChapterKind>(
    chapter.kind ?? (chapter.section === "body" ? "chapter" : "page"),
  );

  const volumes = book.volumes ?? [];
  const parts = (book.parts ?? []).filter(
    (p) => !volumeId || p.volumeId === volumeId || !p.volumeId,
  );

  const commit = () => {
    const chosenPart = (book.parts ?? []).find((p) => p.id === partId);
    onSave({
      options: {
        includeIn,
        beginOn,
        hideHeading: hides.hideHeading,
        hidePageNumber: hides.hidePageNumber,
        hideHeaderFooter: hides.hideHeaderFooter,
        hideToc: hides.hideToc,
        smallerTitle: hides.smallerTitle,
        invertText: hides.invertText,
      },
      partId: partId || undefined,
      volumeId: chosenPart?.volumeId ?? (volumeId || undefined),
      section,
      kind,
    });
    onClose();
  };

  const segmented = <T extends string>(
    options: readonly { value: T; label: string }[],
    value: T,
    setter: (v: T) => void,
  ) => (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setter(o.value)}
          className={`rounded-md px-3 py-1 text-xs font-medium ${
            value === o.value
              ? "bg-accent text-white"
              : "border border-rule text-muted hover:bg-chrome"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-lg border border-rule bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold">Chapter Options</h2>
        <p className="mb-4 truncate text-sm text-muted">{chapter.title}</p>

        <div className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium">Include in</p>
            {segmented(INCLUDE_OPTIONS, includeIn, setIncludeIn)}
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Begin on</p>
            {segmented(BEGIN_OPTIONS, beginOn, setBeginOn)}
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Hide in output</p>
            <div className="grid grid-cols-1 gap-1">
              {HIDE_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={hides[f.key]}
                    onChange={(e) =>
                      setHides((h) => ({ ...h, [f.key]: e.target.checked }))
                    }
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Section</span>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as ChapterSection)}
              className="w-full rounded-md border border-rule px-2 py-1.5"
            >
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Page type</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ChapterKind)}
              className="w-full rounded-md border border-rule px-2 py-1.5"
            >
              {KIND_OPTIONS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Volume</span>
              <select
                value={volumeId}
                onChange={(e) => {
                  setVolumeId(e.target.value);
                  if (e.target.value === "") setPartId("");
                }}
                className="w-full rounded-md border border-rule px-2 py-1.5"
              >
                <option value="">None</option>
                {volumes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Part</span>
              <select
                value={partId}
                onChange={(e) => setPartId(e.target.value)}
                className="w-full rounded-md border border-rule px-2 py-1.5"
              >
                <option value="">None</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-rule px-4 py-1.5 text-sm font-medium hover:bg-chrome"
          >
            Cancel
          </button>
          <button
            onClick={commit}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
