import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  mergeTheme,
  THEME_PRESETS,
  trimLabel,
} from "../src/shared/model/theme";
import { compilePrintCss } from "../src/shared/services/themeCss";
import { sanitizeBook } from "../src/shared/model/validation";
import { buildSampleBook } from "../src/shared/model/sample";

describe("themes & formatting", () => {
  it("exposes preset themes and merges overrides", () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(6);
    const merged = mergeTheme("intratech", { bodyFontSizePt: 13 });
    expect(merged.paragraphStart).toBe("spaced");
    expect(merged.bodyFontSizePt).toBe(13);
    expect(mergeTheme("does-not-exist", undefined)).toEqual(DEFAULT_THEME);
  });

  it("formats a trim label", () => {
    expect(trimLabel(DEFAULT_THEME)).toBe('6" × 9"');
  });

  it("compiles page size and margins", () => {
    const css = compilePrintCss(DEFAULT_THEME);
    expect(css).toContain("size: 6in 9in");
    expect(css).toContain("margin: 0.7in");
  });

  it("compiles a running header and page numbers per settings", () => {
    const css = compilePrintCss({ ...DEFAULT_THEME, pageNumber: "footer", runningHeader: "bookTitle" }, { bookTitle: "My Book" });
    expect(css).toContain("counter(page)");
    expect(css).toContain("My Book");
  });

  it("compiles body typography and drop caps", () => {
    const theme = mergeTheme(undefined, {
      firstParagraph: "dropCap",
      bodyFontSizePt: 12,
      lineHeight: 1.6,
    });
    const css = compilePrintCss(theme);
    expect(css).toContain("font-size: 12pt");
    expect(css).toContain("line-height: 1.6");
    expect(css).toContain("::first-letter");
  });

  it("overrides typography when large print is enabled", () => {
    const css = compilePrintCss({ ...DEFAULT_THEME, largePrint: true });
    expect(css).toContain("font-size: 15pt");
    expect(css).not.toContain("text-align: justify");
  });

  it("preserves theme settings through validation", () => {
    const book = buildSampleBook();
    book.themeName = "intratech";
    book.theme = { bodyFontSizePt: 13, pageNumber: "header" };
    const clean = sanitizeBook(JSON.parse(JSON.stringify(book)))!;
    expect(clean.themeName).toBe("intratech");
    expect(clean.theme).toEqual({ bodyFontSizePt: 13, pageNumber: "header" });
  });
});
