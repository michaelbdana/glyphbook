import type {
  Book,
  Chapter,
  ImageAttrs,
  ProseBlock,
  ProseDoc,
  ProseInline,
} from "../model/types";
import type { BookTheme } from "../model/theme";
import { compilePrintCss } from "./themeCss";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type MarkTag = [open: string, close: string];

function markTag(mark: string): MarkTag | null {
  switch (mark) {
    case "bold":
      return ["<strong>", "</strong>"];
    case "italic":
      return ["<em>", "</em>"];
    case "underline":
      return ["<u>", "</u>"];
    case "strikethrough":
      return ["<s>", "</s>"];
    case "code":
      return ["<code>", "</code>"];
    case "subscript":
      return ["<sub>", "</sub>"];
    case "superscript":
      return ["<sup>", "</sup>"];
    case "smallCaps":
      return ['<span class="mark-small-caps">', "</span>"];
    case "monospace":
      return ['<span class="mark-mono">', "</span>"];
    case "sansSerif":
      return ['<span class="mark-sans">', "</span>"];
    default:
      return null;
  }
}

function inlineHtml(inlines: ProseInline[] | undefined): string {
  return (inlines ?? [])
    .map((inline) => {
      let text = esc(inline.text);
      for (const mark of inline.marks ?? []) {
        const tag = markTag(mark.type);
        if (tag) text = `${tag[0]}${text}${tag[1]}`;
      }
      return text;
    })
    .join("");
}

function alignStyle(attrs: Record<string, unknown> | undefined): string {
  const align = attrs?.textAlign;
  if (
    align === "left" ||
    align === "center" ||
    align === "right" ||
    align === "justify"
  ) {
    return ` style="text-align:${align}"`;
  }
  return "";
}

function figure(image: ImageAttrs, eReader: boolean): string {
  const align = image.align ?? "center";
  const width = image.width ?? 100;
  const max = eReader ? "100%" : `${width}%`;
  const img = `<img src="${esc(image.src)}" alt="${esc(image.alt ?? "")}" style="max-width:${max}" />`;
  const caption = image.caption
    ? `<figcaption style="font-style:italic;font-size:0.85em;text-align:center">${esc(
        image.caption,
      )}</figcaption>`
    : "";
  return `<figure style="text-align:${align};margin:1em 0">${img}${caption}</figure>`;
}

function listHtml(list: ProseBlock & { type: "bulletList" | "orderedList" }): string {
  const tag = list.type === "orderedList" ? "ol" : "ul";
  const items = (list.content ?? [])
    .map((item) => {
      const itemContent =
        item.type === "listItem"
          ? (item.content ?? []).map(blockHtml).join("")
          : blockHtml(item);
      return `<li>${itemContent}</li>`;
    })
    .join("");
  return `<${tag}>${items}</${tag}>`;
}

export function blockHtml(block: ProseBlock): string {
  switch (block.type) {
    case "paragraph": {
      const style = alignStyle(block.attrs);
      return `<p${style}>${inlineHtml(block.content)}</p>`;
    }
    case "heading": {
      const level = Math.min(Math.max(block.attrs?.level ?? 2, 1), 6);
      const style = alignStyle(block.attrs);
      return `<h${level}${style}>${inlineHtml(block.content)}</h${level}>`;
    }
    case "blockquote":
      return `<blockquote>${(block.content ?? []).map(blockHtml).join("")}</blockquote>`;
    case "bulletList":
    case "orderedList":
      return listHtml(block);
    case "listItem":
      return `<li>${(block.content ?? []).map(blockHtml).join("")}</li>`;
    case "horizontalRule":
      return `<hr class="gb-rule" />`;
    case "sceneBreak":
      return `<div class="gb-scenebreak" data-scene-break="true"></div>`;
    case "imageBlock": {
      const attrs = block.attrs ?? ({} as ImageAttrs);
      if (!attrs.src) return "";
      return figure(attrs, true);
    }
    default:
      return "";
  }
}

export function buildBodyHtml(doc: ProseDoc): string {
  return (doc.content ?? []).map(blockHtml).join("");
}

export function ebookChapterHtml(
  chapter: Chapter,
  _first: boolean,
  includeHeading = true,
): string {
  if (chapter.kind === "fullpage" && chapter.image?.src) {
    return `<div style="text-align:center;margin:1.2em 0">${figure(
      chapter.image,
      true,
    )}</div>`;
  }
  const heading = includeHeading
    ? `<h1 style="text-align:center;margin:1.2em 0 0.8em">${esc(chapter.title)}</h1>`
    : "";
  return `${heading}${buildBodyHtml(chapter.content)}`;
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
.reader h1, .reader h2, .reader h3, .reader h4, .reader h5, .reader h6 {
  font-family: ${theme.headingFontFamily};
  line-height: 1.2;
  margin: 1em 0 0.5em;
}
.reader p { orphans: 2; widows: 2; }
.reader .chapter { margin-top: 1.4em; }
.reader img { display: block; margin: 0 auto; height: auto; }
.reader figure { margin: 1em 0; }
.reader blockquote {
  margin: 1em 2em;
  font-style: italic;
  color: #333;
}
.reader ul, .reader ol { margin: 0.6em 0 0.6em 1.4em; padding-left: 1em; }
.reader li { margin: 0.25em 0; }
.reader .gb-scenebreak {
  text-align: center;
  margin: 1.2em 0;
  color: #888;
}
.reader .gb-scenebreak::before {
  content: "* * *";
  letter-spacing: 0.4em;
}
.reader hr.gb-rule {
  border: none;
  border-top: 1px solid #bbb;
  width: 60%;
  margin: 1.2em auto;
}
.mark-small-caps { font-variant: small-caps; }
.mark-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.mark-sans { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.9em; }
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
