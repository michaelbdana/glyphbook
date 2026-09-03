import { describe, it, expect } from "vitest";
import { countWords, countWordsInText } from "../src/shared/services/wordCount";
import { emptyDoc, textBlock } from "../src/renderer/editor/doc";

describe("word count", () => {
  it("counts words in plain text", () => {
    expect(countWordsInText("the quick brown fox")).toBe(4);
    expect(countWordsInText("")).toBe(0);
    expect(countWordsInText("  a   b  ")).toBe(2);
  });

  it("counts words across paragraphs and headings in a doc", () => {
    const doc = {
      type: "doc" as const,
      content: [
        { type: "paragraph" as const, content: [textBlock("one two")] },
        {
          type: "heading" as const,
          attrs: { level: 2 },
          content: [textBlock("three")],
        },
      ],
    };
    expect(countWords(doc)).toBe(3);
  });

  it("counts empty doc as zero", () => {
    expect(countWords(emptyDoc())).toBe(0);
  });
});
