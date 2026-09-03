import { describe, expect, it } from "vitest";
import {
  sanitizeBook,
  serializeLibrary,
  validateLibrary,
} from "../src/shared/model/validation";
import { buildSampleBook } from "../src/shared/model/sample";
import type { ProseDoc } from "../src/shared/model/types";

describe("book validation / codec", () => {
  it("sanitizes garbage into a usable empty book", () => {
    const book = sanitizeBook({ title: 42 });
    expect(book).not.toBeNull();
    expect(book?.title).toBe("Untitled Book");
    expect(book?.chapters).toEqual([]);
  });

  it("rejects non-objects and non-array libraries", () => {
    expect(sanitizeBook("nope")).toBeNull();
    expect(validateLibrary("nope")).toEqual([]);
    expect(validateLibrary([1, "x"])).toEqual([]);
  });

  it("round-trips the sample book without data loss", () => {
    const book = buildSampleBook();
    const roundTripped = sanitizeBook(JSON.parse(JSON.stringify(book)));
    expect(roundTripped).toEqual(book);
  });

  it("preserves text formatting marks", () => {
    const book = buildSampleBook();
    book.chapters[1].content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello ", marks: [] },
            {
              type: "text",
              text: "world",
              marks: [{ type: "bold" }, { type: "italic" }],
            },
          ],
        },
      ],
    };
    const clean = sanitizeBook(book);
    const p = clean?.chapters[1].content.content?.[0];
    expect(p?.type).toBe("paragraph");
    expect(p?.content?.[1].marks?.map((m) => m.type)).toEqual([
      "bold",
      "italic",
    ]);
  });

  it("keeps unknown block nodes such as scene breaks", () => {
    const book = buildSampleBook();
    book.chapters[1].content = {
      type: "doc",
      content: [{ type: "sceneBreak" }],
    } as unknown as ProseDoc;
    const clean = sanitizeBook(book);
    expect(clean?.chapters[1].content.content?.[0]).toEqual({
      type: "sceneBreak",
    });
  });

  it("strips unknown marks but keeps the text", () => {
    const book = buildSampleBook();
    book.chapters[0].content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "keep me", marks: [{ type: "highlight" }] },
          ],
        },
      ],
    };
    const clean = sanitizeBook(book);
    const text = clean?.chapters[0].content.content?.[0]?.content?.[0];
    expect(text?.type).toBe("text");
    expect(text?.text).toBe("keep me");
    expect(text?.marks).toBeUndefined();
  });

  it("serializes with a schema version wrapper", () => {
    const json = serializeLibrary([buildSampleBook()]);
    const parsed = JSON.parse(json) as { schemaVersion: number; books: unknown };
    expect(parsed.schemaVersion).toBe(1);
    expect(Array.isArray(parsed.books)).toBe(true);
  });
});
