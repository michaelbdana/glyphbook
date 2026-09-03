import type { Book, Chapter, ImageAttrs, ProseBlock, ProseInline } from "../model/types";
import type { BookTheme } from "../model/theme";
import { compilePrintCss } from "./themeCss";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(inlines: ProseInline[] | undefined): string {
  return (inlines ?? [])
    .map((i) => {
      const text = esc(i.text);
      if (i.marks?.some((m) => m.type === "bold")) return `<strong>${text}</strong>`;
      if (i.marks?.some((m) => m.type === "italic")) return `<em>${text}</em>`;
      if (i.marks?.some((m) => m.type === "strikethrough")) {
        return `<s>${text}</s>`;
      }
      return text;
    })
    .join("");
}

function figure(image: ImageAttrs, eReader: boolean): string {
  const align = image.align ?? "center";
  const width = image.width ?? 100;
  const max = eReader ? "100%" : `${width}%`;
  const style = `max-width:${max}`;
  const img = `<img src="${esc(image.src)}" alt="${esc(image.alt ?? "")}" style="${style}" />`;
  const caption = image.caption
    ? `<figcaption style="font-style:italic;font-size:0.85em;text-align:center">${esc(image.caption)}</figcaption>`
    : "";
  return `<figure style="text-align:${align};margin:1em 0">${img}${caption}</figure>`;
}

export function ebookChapterHtml(
  chapter: Chapter,
  first: boolean,
  includeHeading = true,
): string {
  if (chapter.kind === "fullpage" && chapter.image?.src) {
    return `<div style="text-align:center;margin:1.2em 0">${figure(chapter.image, true)}</div>`;
  }
  const heading = includeHeading
    ? `<h1 style="text-align:center;margin:1.2em 0 0.8em">${esc(chapter.title)}</h1>`
    : "";
  const body = (chapter.content.content ?? [])
    .map((block: ProseBlock) => {
      if (block.type === "heading") {
        return `<h2 style="text-align:center">${inline(block.content)}</h2>`;
      }
      if (block.type === "imageBlock") {
        return figure(block.attrs ?? ({} as ImageAttrs), true);
      }
      if (block.type === "paragraph") {
        return `<p>${inline(block.content)}</p>`;
      }
      if (block.type === "sceneBreak") {
        return `<div style="text-align:center;margin:1em 0">&#10047;</div>`;
      }
      return "";
    })
    .join("");
  return `<section class="${first ? "first" : "chapter"}">${heading}${body}</section>`;
}

export function ebookCss(theme: BookTheme, widthPx: number): string {
  const para =
    theme.paragraphStart === "indent"
      ? `.reader p { text-indent: 1.5em; margin: 0 0 0.35em; }`
      : `.reader p { margin: 0 0 1em; text-indent: 0; }`;
  return `
html, body { margin: 0; background: #c8c9cc; }
.reader {
  width: ${widthPx}px;
  min-height: 100vh;
  margin: 0 auto;
  background: #fff;
  padding: 40px 34px;
  box-sizing: border-box;
  font-family: ${theme.bodyFontFamily};
  font-size: ${theme.bodyFontSizePt}pt;
  line-height: ${theme.lineHeight};
  ${theme.justify ? "text-align: justify;" : "text-align: left;"}
  color: #111;
}
.reader h1 {
  font-family: ${theme.headingFontFamily};
  font-size: ${theme.headingFontSizePt}pt;
  line-height: 1.2;
  text-align: center;
}
.reader h2 {
  font-family: ${theme.headingFontFamily};
  text-align: center;
  margin: 1em 0 0.6em;
}
.reader p { orphans: 2; widows: 2; }
.reader .chapter { margin-top: 1.4em; }
.reader img { display: block; margin: 0 auto; height: auto; }
.reader figure { margin: 1em 0; }
${para}
`;
}

export function printPreviewDoc(
  book: Book,
  theme: BookTheme,
  chapter: Chapter | undefined,
): string {
  const target =
    chapter ??
    book.chapters.find((c) => c.kind === "chapter" && c.content.content?.length) ??
    book.chapters[0];
  if (!target) return "<html><body></body></html>";
  const html = ebookChapterHtml(target, true, false);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${compilePrintCss(
    theme,
    { bookTitle: book.title },
  )}</style></head><body><section class="chapter first">${html}</section></body></html>`;
}
