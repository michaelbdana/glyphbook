import type { ReactElement } from "react";
import { Smartphone } from "lucide-react";
import type { Chapter, ProseBlock } from "../../shared/model/types";

const DEVICES = [
  "iPhone",
  "iPad",
  "Kindle Paperwhite",
  "Kindle Oasis",
  "Kobo Forma",
  "Nook Glowlight",
  "Print",
];

function blockText(block: ProseBlock): ReactElement | null {
  const text = (block.content ?? []).map((i) => i.text).join("");
  if (block.type === "heading") {
    return <h2 className="mb-3 text-center text-lg font-semibold">{text}</h2>;
  }
  return <p className="mb-3 text-[13px] leading-relaxed">{text}</p>;
}

export default function PreviewPane({ chapter }: { chapter: Chapter | null }) {
  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-rule bg-chrome">
      <div className="flex items-center gap-2 border-b border-rule px-3 py-2">
        <Smartphone className="h-4 w-4 text-muted" />
        <select
          className="w-full rounded border border-rule bg-white px-2 py-1 text-xs"
          defaultValue={DEVICES[2]}
        >
          {DEVICES.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-1 items-start justify-center overflow-y-auto bg-chrome-dark p-4">
        {chapter ? (
          <div className="w-[220px] bg-paper px-3 py-4 shadow-md">
            <p className="mb-4 text-center text-xs font-semibold text-muted">
              {chapter.title}
            </p>
            {chapter.content.content?.map((block, i) => (
              <div key={i}>{blockText(block)}</div>
            ))}
          </div>
        ) : (
          <p className="mt-10 text-xs text-muted">Open a chapter to preview</p>
        )}
      </div>
    </aside>
  );
}
