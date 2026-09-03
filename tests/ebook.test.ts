import { describe, expect, it } from "vitest";
import type { ProseDoc } from "../src/shared/model/types";
import { countWords } from "../src/shared/services/wordCount";
import { replaceInDoc } from "../src/shared/services/findReplace";
import { buildBodyHtml, ebookCss } from "../src/shared/services/ebookHtml";
import { DEFAULT_THEME } from "../src/shared/model/theme";

function doc(content: unknown[]): ProseDoc {
  return { type: "doc", content: content as ProseDoc["content"] };
}

const bulletDoc = doc([
  {
    type: "bulletList",
    content: [
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "one two" }] },
        ],
      },
      {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "three" }] },
        ],
      },
    ],
  },
]);

describe("nested content support", () => {
  it("counts words inside list items", () => {
    expect(countWords(bulletDoc)).toBe(3);
  });

  it("finds and replaces text inside lists", () => {
    const result = replaceInDoc(bulletDoc, "three", "four");
    expect(result.replaced).toBe(1);
    expect(JSON.stringify(result.doc)).toContain("four");
  });

  it("renders lists, block quotes, and marks", () => {
    const rich = doc([
      {
        type: "paragraph",
        content: [
          { type: "text", text: "under" },
          {
            type: "text",
            text: "scored",
            marks: [{ type: "underline" }],
          },
        ],
      },
      { type: "blockquote", content: bulletDoc.content as unknown[] },
      { type: "horizontalRule" },
    ]);
    const html = buildBodyHtml(rich);
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
    expect(html).toContain("<u>scored</u>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain('hr class="gb-rule"');
  });

  it("compiles ebook css without crashing", () => {
    const css = ebookCss(DEFAULT_THEME, 600);
    expect(css).toContain(".reader");
  });

  it("renders text alignment from paragraph attributes", () => {
    const aligned = doc([
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [{ type: "text", text: "centered line" }],
      },
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [{ type: "text", text: "right line" }],
      },
    ]);
    const html = buildBodyHtml(aligned);
    expect(html).toContain('style="text-align:center"');
    expect(html).toContain('style="text-align:right"');
  });
});
