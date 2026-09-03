import type { BookTheme } from "../model/theme";

export type PrintContext = { bookTitle?: string };

function cssQuote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
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

  const size = `${theme.trimWidthIn}in ${theme.trimHeightIn}in`;
  const margins = [
    `${theme.marginTopIn}in`,
    theme.marginOutsideIn,
    theme.marginBottomIn,
    theme.marginInsideIn,
  ];
  const marginSpec = `${margins[0]} ${margins[1]}in ${margins[2]} ${margins[3]}in`;

  const topContentValue = topContent(theme, ctx);
  const bottomBox = theme.pageNumber === "footer" ? "counter(page)" : "";

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

  return `
@page {
  size: ${size};
  margin: ${marginSpec};
  ${topContentValue ? `@top-center { ${topContentValue} font-size: 9pt; color: #444; }` : ""}
  ${bottomBox ? `@bottom-center { content: ${cssQuote(bottomBox)}; font-size: 9pt; color: #444; }` : ""}
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

div[data-scene-break] { text-align: center; margin: 1.2em 0; }
${ornament}
`;
}
