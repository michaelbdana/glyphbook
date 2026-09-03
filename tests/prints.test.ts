import { describe, expect, it } from "vitest";
import {
  applyPrintToTheme,
  defaultPrints,
  printKindLabel,
} from "../src/shared/model/prints";
import { DEFAULT_THEME } from "../src/shared/model/theme";
import { compilePrintCss } from "../src/shared/services/themeCss";
import { sanitizeBook } from "../src/shared/model/validation";
import { buildSampleBook } from "../src/shared/model/sample";

describe("print versions", () => {
  it("creates Paperback, Hardcover, and Large Print by default", () => {
    const prints = defaultPrints();
    expect(prints.map((p) => p.kind)).toEqual([
      "paperback",
      "hardcover",
      "largePrint",
    ]);
    expect(prints.map((p) => printKindLabel(p.kind))).toEqual([
      "Paperback",
      "Hardcover",
      "Large Print",
    ]);
  });

  it("gives Large Print larger typography by default", () => {
    const large = defaultPrints().find((p) => p.kind === "largePrint")!;
    expect(large.fontSizePt).toBe(16);
    expect(large.lineHeight).toBe(1.6);
    expect(large.justify).toBe(false);
  });

  it("applies a print config over the theme", () => {
    const print = defaultPrints().find((p) => p.kind === "paperback")!;
    const withPrint = applyPrintToTheme(DEFAULT_THEME, print);
    expect(withPrint.trimWidthIn).toBe(6);
    expect(withPrint.marginInsideIn).toBe(0.8);
  });

  it("compiles bleed geometry per KDP (width +0.125, height +0.25)", () => {
    const css = compilePrintCss(DEFAULT_THEME, { bleed: true });
    expect(css).toContain("size: 6.125in 9.25in");
    expect(css).toContain("margin: 0.825in");
  });

  it("sanitizes malformed print entries back to valid configs", () => {
    const book = buildSampleBook();
    const raw = JSON.parse(JSON.stringify(book)) as Record<string, unknown>;
    raw.prints = [
      { id: "p1", kind: "spaceShuttle", trimWidthIn: -1 },
      "junk",
    ];
    const clean = sanitizeBook(raw)!;
    expect(clean.prints).toHaveLength(1);
    expect(clean.prints![0].kind).toBe("paperback");
    expect(clean.prints![0].trimWidthIn).toBeGreaterThan(0);
    expect(clean.prints![0].trimHeightIn).toBeGreaterThan(0);
  });

  it("compiles print-only header/footer margin boxes with macros", () => {
    const css = compilePrintCss(DEFAULT_THEME, {
      bookTitle: "My Book",
      authorName: "Jane Doe",
      headers: {
        top: {
          left: { text: "{book}", italic: true },
          center: { text: "Chapter {chapter}" },
        },
        bottom: {
          center: { text: "{page} of {total}", bold: true },
          right: { text: "{author}" },
        },
      },
    });
    expect(css).toContain("@top-left");
    expect(css).toContain("@top-center");
    expect(css).toContain("counter(page)");
    expect(css).toContain("counter(pages)");
    expect(css).toContain("string(chapter)");
    expect(css).toContain("My Book");
    expect(css).toContain("Jane Doe");
    expect(css).toContain("font-weight: bold");
    expect(css).toContain("@bottom-right");
  });

  it("falls back to theme headers when no print header/footer is set", () => {
    const css = compilePrintCss(
      { ...DEFAULT_THEME, pageNumber: "footer", runningHeader: "bookTitle" },
      { bookTitle: "My Book" },
    );
    expect(css).toContain("@bottom-center");
    expect(css).toContain("counter(page)");
  });

  it("round-trips print header/footer through validation", () => {
    const book = buildSampleBook();
    book.prints = defaultPrints();
    book.prints[0].headerFooter = {
      header: { right: { text: "{page}", bold: true } },
      footer: { center: { text: "{book}" } },
    };
    const clean = sanitizeBook(JSON.parse(JSON.stringify(book)))!;
    expect(clean.prints![0].headerFooter?.header?.right?.text).toBe("{page}");
    expect(clean.prints![0].headerFooter?.header?.right?.bold).toBe(true);
    expect(clean.prints![0].headerFooter?.footer?.center?.text).toBe("{book}");
  });
});
