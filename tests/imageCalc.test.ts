import { describe, expect, it } from "vitest";
import {
  fullBleedImageSize,
  marginImageSize,
} from "../src/shared/services/imageCalc";

describe("image size calculator", () => {
  it("adds bleed for full-page images", () => {
    const size = fullBleedImageSize(6, 9, 300);
    expect(size.widthPx).toBe(1838);
    expect(size.heightPx).toBe(2775);
  });

  it("fits in-chapter images inside the margins", () => {
    const size = marginImageSize(6, 0.85, 0.8, 300);
    expect(size.widthIn).toBeCloseTo(4.35);
    expect(size.widthPx).toBe(1305);
  });

  it("handles zero-width margins gracefully", () => {
    expect(marginImageSize(5, 0, 0, 300).widthIn).toBe(5);
  });
});
