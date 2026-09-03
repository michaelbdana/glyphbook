import { describe, expect, it } from "vitest";
import {
  makePresetChapter,
  PRESETS,
  uniqueTitle,
} from "../src/shared/model/presets";
import { sanitizeBook } from "../src/shared/model/validation";
import { buildSampleBook } from "../src/shared/model/sample";

describe("book structure", () => {
  it("offers preset layouts for every section", () => {
    const sections = PRESETS.map((p) => p.section);
    expect(sections).toContain("front");
    expect(sections).toContain("body");
    expect(sections).toContain("back");
    expect(PRESETS.find((p) => p.key === "dedication")?.section).toBe("front");
    expect(PRESETS.find((p) => p.key === "epilogue")?.section).toBe("body");
    expect(PRESETS.find((p) => p.key === "about")?.section).toBe("back");
  });

  it("creates unique preset titles when duplicates exist", () => {
    const book = buildSampleBook();
    const first = makePresetChapter(book, PRESETS.find((p) => p.key === "epigraph")!);
    const second = makePresetChapter(
      { ...book, chapters: [...book.chapters, first] },
      PRESETS.find((p) => p.key === "epigraph")!,
    );
    expect(first.title).toBe("Epigraph");
    expect(second.title).toBe("Epigraph 2");
    expect(uniqueTitle({ ...book, chapters: [] }, "Chapter")).toBe("Chapter");
  });

  it("preserves kinds, options and groups through validation", () => {
    const book = buildSampleBook();
    book.chapters[0].kind = "title";
    book.chapters[0].options = {
      includeIn: "ebook",
      beginOn: "right",
      hideToc: true,
    };
    book.parts = [{ id: "p1", title: "Part One", subtitle: "The Beginning" }];
    book.volumes = [{ id: "v1", title: "Volume 1" }];
    book.chapters[1].partId = "p1";
    book.chapters[1].volumeId = "v1";

    const clean = sanitizeBook(JSON.parse(JSON.stringify(book)))!;

    expect(clean.chapters[0].kind).toBe("title");
    expect(clean.chapters[0].options?.includeIn).toBe("ebook");
    expect(clean.chapters[0].options?.beginOn).toBe("right");
    expect(clean.chapters[0].options?.hideToc).toBe(true);
    expect(clean.chapters[0].options?.hideHeading).toBe(false);
    expect(clean.parts).toEqual([{ id: "p1", title: "Part One", subtitle: "The Beginning" }]);
    expect(clean.volumes).toEqual([{ id: "v1", title: "Volume 1" }]);
    expect(clean.chapters[1].partId).toBe("p1");
    expect(clean.chapters[1].volumeId).toBe("v1");
  });

  it("rejects unknown kinds and non-record groups", () => {
    const book = buildSampleBook();
    const raw = JSON.parse(JSON.stringify(book)) as { chapters: Array<Record<string, unknown>> };
    raw.chapters[0].kind = "mystery";
    const clean = sanitizeBook({ ...book, chapters: raw.chapters, parts: "nope", volumes: [7] })!;
    expect(clean.chapters[0].kind).toBeUndefined();
    expect(clean.parts).toBeUndefined();
    expect(clean.volumes).toEqual([]);
  });
});
