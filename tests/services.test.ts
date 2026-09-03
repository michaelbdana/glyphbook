import { describe, expect, it } from "vitest";
import {
  findInBook,
  findInChapter,
  replaceInBook,
  replaceInDoc,
} from "../src/shared/services/findReplace";
import { buildSampleBook } from "../src/shared/model/sample";
import { transformDoc, transformText } from "../src/shared/services/smartQuotes";
import { computePlan, computeStreak, daysUntilDue } from "../src/shared/services/goals";

const BOOK = buildSampleBook();
const CHAPTER_ONE = BOOK.chapters.find(
  (c) => c.kind === "chapter" && c.title === "Chapter One",
)!;

describe("find & replace", () => {
  it("counts matches per chapter", () => {
    const matches = findInBook(BOOK, "the", { caseSensitive: true });
    expect(matches.length).toBeGreaterThan(0);
    const total = matches.reduce((n, m) => n + m.count, 0);
    expect(total).toBeGreaterThan(0);
    expect(findInBook(BOOK, "zzz-no-match")).toEqual([]);
  });

  it("is case-insensitive by default", () => {
    const matches = findInChapter(CHAPTER_ONE, "THE");
    expect(matches && matches.count).toBeGreaterThan(0);
  });

  it("respects case sensitivity", () => {
    expect(findInChapter(CHAPTER_ONE, "THE", { caseSensitive: true })).toBeNull();
  });

  it("replaces across the whole book and reports the count", () => {
    const result = replaceInBook(BOOK, "the", "THE");
    expect(result.replaced).toBeGreaterThan(0);
    const after = findInBook({ ...BOOK, chapters: result.chapters }, "the");
    const total = after.reduce((n, m) => n + m.count, 0);
    expect(total).toBe(result.replaced);
    expect(findInBook({ ...BOOK, chapters: result.chapters }, "THE")).not.toEqual([]);
  });

  it("replaces a unique token exactly once", () => {
    const { doc, replaced } = replaceInDoc(CHAPTER_ONE.content, "wind", "breeze");
    expect(replaced).toBeGreaterThanOrEqual(1);
    const html = JSON.stringify(doc);
    expect(html).toContain("breeze");
    expect(html).not.toContain(">wind<");
  });
});

describe("smart quotes", () => {
  it("converts paired double quotes", () => {
    const { text, count } = transformText('She said "hello" twice.', {
      doubleOpen: false,
      singleOpen: false,
    });
    expect(text).toBe("She said \u201Chello\u201D twice.");
    expect(count).toBe(2);
  });

  it("converts apostrophes inside words", () => {
    const { text } = transformText("don't", {
      doubleOpen: false,
      singleOpen: false,
    });
    expect(text).toBe("don\u2019t");
  });

  it("carries quote state across text runs", () => {
    const state = { doubleOpen: false, singleOpen: false };
    transformText('He said "yes', state);
    const second = transformText(' and left."', state);
    expect(second.text).toContain("\u201D");
    expect(second.count).toBe(1);
  });

  it("counts conversions in a document", () => {
    const doc = {
      type: "doc" as const,
      content: [
        {
          type: "paragraph" as const,
          content: [{ type: "text" as const, text: '"Hi," she said.' }],
        },
      ],
    };
    const result = transformDoc(doc);
    expect(result.count).toBe(2);
  });
});

describe("goals", () => {
  it("computes a plan with no goal", () => {
    const plan = computePlan(undefined, 5000);
    expect(plan.percentComplete).toBe(0);
    expect(plan.requiredPerWritingDay).toBeNull();
  });

  it("computes percentage and remaining words", () => {
    const plan = computePlan({ targetWords: 10000 }, 2500);
    expect(plan.remainingWords).toBe(7500);
    expect(plan.percentComplete).toBe(25);
  });

  it("computes required words per day for a due date", () => {
    const due = new Date();
    due.setDate(due.getDate() + 2);
    const plan = computePlan(
      { targetWords: 1000, dueDate: due.toISOString() },
      0,
    );
    expect(plan.daysRemaining).toBe(2);
    expect(plan.requiredPerWritingDay).toBeGreaterThan(0);
  });

  it("ignores invalid due dates", () => {
    expect(daysUntilDue("not-a-date")).toBeNull();
  });

  it("computes a streak from the habit log", () => {
    const today = new Date();
    const key = (offset: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const log: Record<string, number> = {};
    for (let i = 0; i < 4; i += 1) log[key(i)] = 600;
    const streak = computeStreak(log, { dailyWords: 500, writingDays: [] });
    expect(streak.currentStreak).toBeGreaterThanOrEqual(4);
    expect(streak.wordsToday).toBe(600);
    expect(streak.goalMetToday).toBe(true);
  });
});
