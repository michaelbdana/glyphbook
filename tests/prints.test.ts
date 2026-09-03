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
});
