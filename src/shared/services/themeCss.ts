import type { BookTheme } from "../model/theme";
import type { HeaderBox, HeaderBoxes } from "../model/prints";

export type PrintContext = {
  bookTitle?: string;
  bleed?: boolean;
  authorName?: string;
  headers?: { top?: HeaderBoxes; bottom?: HeaderBoxes };
};

function cssQuote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function boxStyle(box: HeaderBox): string {
  const style: string[] = ["font-size: 9pt"];
  if (box.bold) style.push("font-weight: bold");
  if (box.italic) style.push("font-style: italic");
  if (box.underline) style.push("text-decoration: underline");
  return style.join("; ");
}

function contentParts(box: HeaderBox, ctx: PrintContext): string[] {
  const tokens: string[] = [];
  const pattern = /\{(page|pages|total|book|author|chapter)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(box.text)) !== null) {
    if (match.index > last) {
      tokens.push(cssQuote(box.text.slice(last, match.index)));
    }
    const macro = match[1];
    if (macro === "page") tokens.push("counter(page)");
    else if (macro === "pages" || macro === "total") tokens.push("counter(pages)");
    else if (macro === "book") tokens.push(cssQuote(ctx.bookTitle ?? ""));
    else if (macro === "author") tokens.push(cssQuote(ctx.authorName ?? ""));
    else tokens.push("string(chapter)");
    last = match.index + match[0].length;
  }
  if (last < box.text.length) {
    tokens.push(cssQuote(box.text.slice(last)));
  }
  return tokens;
}

function marginBoxRule(
  boxName: string,
  box: HeaderBox,
  ctx: PrintContext,
): string {
  const parts = contentParts(box, ctx).filter(Boolean);
  if (parts.length === 0) return "";
  return `@${boxName} { content: ${parts.join(" ")}; ${boxStyle(box)}; }`;
}

function boxesRules(boxes: HeaderBoxes, ctx: PrintContext): string {
  const rules: string[] = [];
  for (const [position, box] of [
    ["top-left", boxes.left],
    ["top-center", boxes.center],
    ["top-right", boxes.right],
  ] as const) {
    if (box) {
      const rule = marginBoxRule(position, box, ctx);
      if (rule) rules.push(rule);
    }
  }
  return rules.join("\n");
}

function bottomBoxesRules(boxes: HeaderBoxes, ctx: PrintContext): string {
  const rules: string[] = [];
  for (const [position, box] of [
    ["bottom-left", boxes.left],
    ["bottom-center", boxes.center],
    ["bottom-right", boxes.right],
  ] as const) {
    if (box) {
      const rule = marginBoxRule(position, box, ctx);
      if (rule) rules.push(rule);
    }
  }
  return rules.join("\n");
}

function topHeader(theme: BookTheme, ctx: PrintContext): string {
  if (theme.runningHeader === "none") return "";
  if (theme.runningHeader === "bookTitle") {
    return `content: ${cssQuote(ctx.bookTitle ?? "")};`;
  }
  return "content: string(chapter);";
}

function topContent(theme: BookTheme, ctx: PrintContext): string {
  if (theme.pageNumber === "header") return "content: counter(page);";
  return topHeader(theme, ctx);
}

export function compilePrintCss(themeIn: BookTheme, ctx: PrintContext = {}): string {
  let theme = { ...themeIn };
  if (theme.largePrint) {
    theme = {
      ...theme,
      bodyFontSizePt: 15,
      lineHeight: 1.6,
      justify: false,
    };
  }

  const hasBleed = ctx.bleed === true;
  const widthIn = theme.trimWidthIn + (hasBleed ? 0.125 : 0);
  const heightIn = theme.trimHeightIn + (hasBleed ? 0.25 : 0);
  const size = `${widthIn}in ${heightIn}in`;
  const bleedTop = hasBleed ? 0.125 : 0;
  const bleedBottom = hasBleed ? 0.125 : 0;
  const bleedOutside = hasBleed ? 0.125 : 0;
  const bleedInside = 0;
  const marginSpec = `${theme.marginTopIn + bleedTop}in ${
    theme.marginOutsideIn + bleedOutside
  }in ${theme.marginBottomIn + bleedBottom}in ${
    theme.marginInsideIn + bleedInside
  }in`;

  const topContentValue = topContent(theme, ctx);
  const bottomBox = theme.pageNumber === "footer" ? "counter(page)" : "";

  const hasCustomHeaders = Boolean(
    ctx.headers && (ctx.headers.top || ctx.headers.bottom),
  );
  let headerRules = "";
  if (ctx.headers?.top) headerRules += boxesRules(ctx.headers.top, ctx);
  if (ctx.headers?.bottom) headerRules += bottomBoxesRules(ctx.headers.bottom, ctx);
  const marginBoxes = hasCustomHeaders
    ? headerRules
    : `${topContentValue ? `@top-center { ${topContentValue} font-size: 9pt; color: #444; }` : ""}${
        bottomBox ? `@bottom-center { content: ${cssQuote(bottomBox)}; font-size: 9pt; color: #444; }` : ""
      }`;

  const paragraphStart =
    theme.paragraphStart === "indent"
      ? `p { text-indent: 0.25in; }`
      : `p { margin-bottom: 0.28em; text-indent: 0; }`;

  const justify = theme.justify
    ? "text-align: justify;"
    : "text-align: left;";

  const dropCaps =
    theme.firstParagraph === "none"
      ? ""
      : `.chapter p:first-of-type::first-letter {
  float: left;
  font-size: 3.2em;
  line-height: 0.85;
  padding-right: 0.06em;
  font-family: ${theme.headingFontFamily};
}
.chapter p:first-of-type { text-indent: 0; }`;

  const ornament =
    theme.sceneBreakOrnament && theme.sceneBreakOrnament.trim()
      ? `div[data-scene-break]::before {
  content: ${cssQuote(theme.sceneBreakOrnament)};
}`
      : "";

  const fullPageCss = `
.chapter.fullpage { text-align: center; }
.chapter.fullpage .fullpage-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}`;

  const blockCss = `
h2, h3, h4, h5, h6 {
  font-family: ${theme.headingFontFamily};
  line-height: 1.3;
  margin: 1.1em 0 0.5em;
}
h2 { font-size: 15pt; }
h3 { font-size: 13.5pt; }
h4 { font-size: 13pt; }
h5 { font-size: 12.5pt; }
h6 { font-size: 12pt; }
.chapter div[data-scene-break]::before {
  content: "* * *";
  letter-spacing: 0.4em;
  color: #888;
}
blockquote {
  margin: 1em 1.6em;
  font-style: italic;
  color: #222;
}
ul, ol { margin: 0.5em 0 0.5em 1.4em; }
li { margin: 0.2em 0; }
hr.gb-rule { border: none; border-top: 1px solid #999; width: 60%; margin: 1.2em auto; }
.mark-small-caps { font-variant: small-caps; }
.mark-mono, code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.9em; }
.mark-sans { font-family: ui-sans-serif, system-ui, sans-serif; }
u { text-decoration: underline; }`;

  return `
@page {
  size: ${size};
  margin: ${marginSpec};
${marginBoxes}
}

html, body { margin: 0; padding: 0; background: #fff; }

body {
  font-family: ${theme.bodyFontFamily};
  font-size: ${theme.bodyFontSizePt}pt;
  line-height: ${theme.lineHeight};
}

.chapter { break-before: page; }
.chapter:first-of-type { break-before: avoid; }

h1 {
  font-family: ${theme.headingFontFamily};
  font-size: ${theme.headingFontSizePt}pt;
  text-align: ${theme.headingAlign};
  line-height: 1.25;
  margin: 0 0 0.35in;
}

h1.title {
  text-align: center;
  font-size: ${Math.round(theme.headingFontSizePt * 1.35)}pt;
}

h2.center { font-family: ${theme.headingFontFamily}; text-align: center; }

p {
  margin: 0;
  orphans: 2;
  widows: 2;
  ${justify}
}

${paragraphStart}
${dropCaps}

${blockCss}
${ornament}
${fullPageCss}
`;
}
