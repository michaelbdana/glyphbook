import { useMemo, useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import type { Book, Chapter } from "../../shared/model/types";
import { mergeTheme, type BookTheme } from "../../shared/model/theme";
import { PREVIEW_DEVICES } from "../../shared/model/devices";
import {
  ebookChapterHtml,
  ebookCss,
  printPreviewDoc,
} from "../../shared/services/ebookHtml";

type Props = {
  book: Book;
  chapter?: Chapter | null;
  showPrint?: boolean;
  initial?: string;
  themeOverride?: BookTheme;
};

export default function BookPreview({
  book,
  chapter,
  showPrint = false,
  initial = "paperwhite",
  themeOverride,
}: Props) {
  const [deviceId, setDeviceId] = useState(initial);
  const theme = useMemo(
    () => themeOverride ?? mergeTheme(book.themeName, book.theme),
    [book, themeOverride],
  );

  const device = PREVIEW_DEVICES.find((d) => d.id === deviceId) ?? PREVIEW_DEVICES[0];
  const isPrint = deviceId === "print";

  const srcDoc = useMemo(() => {
    if (isPrint) {
      return printPreviewDoc(book, theme, chapter ?? undefined);
    }
    const chapters = chapter ? [chapter] : book.chapters;
    const sections = chapters
      .filter((c) => (c.options?.includeIn ?? "all") !== "none")
      .map((c, i) => ebookChapterHtml(c, i === 0, true))
      .join("");
    const css = ebookCss(theme, device.widthPx);
    return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="reader">${sections}</div></body></html>`;
  }, [book, theme, chapter, device, isPrint]);

  const bezel = isPrint ? "bg-chrome-dark" : device.kind === "phone" ? "bg-neutral-800" : "bg-neutral-500";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-rule px-3 py-2">
        <MonitorSmartphone className="h-4 w-4 text-muted" />
        <select
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="w-full rounded border border-rule bg-white px-2 py-1 text-xs"
        >
          {showPrint && <option value="print">Print (true to export)</option>}
          {PREVIEW_DEVICES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-auto bg-chrome-dark p-4">
        <div className="mx-auto w-fit">
          <div className={`${bezel} rounded-md p-2 shadow-lg`}>
            <iframe
              title="Book preview"
              srcDoc={srcDoc}
              className="block border-0 bg-white"
              style={{
                width: isPrint ? theme.trimWidthIn * 96 : device.widthPx,
                height: isPrint ? theme.trimHeightIn * 96 : 640,
              }}
            />
          </div>
        </div>
        <div className="mx-auto mt-2 w-fit px-2 py-1 text-center text-[10px] text-muted">
          {isPrint
            ? `${theme.trimWidthIn}" × ${theme.trimHeightIn}" · page count computed at export`
            : `${device.label} · approximation — real readers vary by settings`}
        </div>
      </div>
    </div>
  );
}
