import { describe, expect, it } from "vitest";
import { reorderInSections } from "../src/shared/model/reorder";
import type { Chapter } from "../src/shared/model/types";

function ch(id: string, section: Chapter["section"]): Chapter {
  return {
    id,
    title: id,
    section,
    numbered: section === "body",
    content: { type: "doc", content: [] },
  };
}

const book = [
  ch("f1", "front"),
  ch("f2", "front"),
  ch("b1", "body"),
  ch("b2", "body"),
  ch("b3", "body"),
  ch("z1", "back"),
];

describe("reorderInSections", () => {
  it("moves a chapter before another within the same section", () => {
    const result = reorderInSections(book, "b3", { kind: "before", targetId: "b1" });
    expect(result.map((c) => c.id)).toEqual(["f1", "f2", "b3", "b1", "b2", "z1"]);
    expect(result[2].section).toBe("body");
  });

  it("moves a chapter to the end of another section and updates its section", () => {
    const result = reorderInSections(book, "b2", {
      kind: "endOfSection",
      section: "back",
    });
    expect(result.map((c) => c.id)).toEqual(["f1", "f2", "b1", "b3", "z1", "b2"]);
    expect(result[5].section).toBe("back");
  });

  it("moving to an empty section appends and updates the section", () => {
    const result = reorderInSections(book, "b2", {
      kind: "endOfSection",
      section: "front",
    });
    const moved = result.find((c) => c.id === "b2");
    expect(moved?.section).toBe("front");
  });

  it("dropping a chapter onto a row of a different section appends to that section", () => {
    const result = reorderInSections(book, "f1", { kind: "before", targetId: "z1" });
    expect(result[result.length - 1].id).toBe("f1");
    expect(result[result.length - 1].section).toBe("back");
  });

  it("is a no-op for an unknown drag id or target", () => {
    expect(reorderInSections(book, "nope", { kind: "endOfSection", section: "body" })).toEqual(book);
    expect(reorderInSections(book, "b1", { kind: "before", targetId: "nope" })).toEqual(book);
  });
});
