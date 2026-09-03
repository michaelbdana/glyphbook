import { describe, expect, it } from "vitest";
import {
  boundaryKind,
  isLikelyBoundary,
  cleanTitle,
} from "../src/shared/services/outline";

describe("chapter outline heuristics", () => {
  it("detects chapter markers by words", () => {
    expect(boundaryKind("Chapter One")).toBe("chapter");
    expect(boundaryKind("CHAPTER 12")).toBe("chapter");
    expect(boundaryKind("Prologue")).toBe("prologue");
    expect(boundaryKind("Epilogue")).toBe("epilogue");
    expect(boundaryKind("About the Author")).toBe("back");
    expect(boundaryKind("A stormy night on the cliffs.")).toBeNull();
  });

  it("cleans stray whitespace", () => {
    expect(cleanTitle("  Chapter   One ")).toBe("Chapter One");
  });

  it("treats a styled, centered, short heading as a boundary", () => {
    expect(
      isLikelyBoundary({
        text: "Chapter Two",
        styleLevel: 2,
        pageBreakBefore: true,
        centered: true,
        isFirstParagraph: false,
      }),
    ).toBe("chapter");
  });

  it("treats a plain short centered heading as a boundary only with page break", () => {
    expect(
      isLikelyBoundary({
        text: "Interlude",
        styleLevel: 2,
        pageBreakBefore: true,
        centered: true,
        isFirstParagraph: false,
      }),
    ).toBe("chapter");
  });

  it("never splits on a long body paragraph", () => {
    expect(
      isLikelyBoundary({
        text: "The wind arrived before the rain did, tearing across the headland in long, hungry gusts that night.",
        styleLevel: 0,
        pageBreakBefore: false,
        centered: false,
        isFirstParagraph: false,
      }),
    ).toBeNull();
  });
});
