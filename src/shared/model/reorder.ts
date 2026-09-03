import type { Chapter, ChapterSection } from "./types";

export type ReorderDrop =
  | { kind: "before"; targetId: string }
  | { kind: "endOfSection"; section: ChapterSection };

export function reorderInSections(
  chapters: Chapter[],
  dragId: string,
  drop: ReorderDrop,
): Chapter[] {
  const from = chapters.findIndex((c) => c.id === dragId);
  if (from === -1) return chapters;
  const dragged = chapters[from];

  const afterRemoval = chapters.filter((c) => c.id !== dragId);

  let targetSection = dragged.section;
  let insertIndex: number;

  if (drop.kind === "endOfSection") {
    targetSection = drop.section;
    const lastTarget = afterRemoval.reduce<number>(
      (last, c, i) => (c.section === targetSection ? i : last),
      -1,
    );
    insertIndex = lastTarget === -1 ? afterRemoval.length : lastTarget + 1;
  } else {
    const target = afterRemoval.find((c) => c.id === drop.targetId);
    if (!target) return chapters;
    if (target.section === dragged.section) {
      insertIndex = afterRemoval.findIndex((c) => c.id === drop.targetId);
    } else {
      targetSection = target.section;
      const lastTarget = afterRemoval.reduce<number>(
        (last, c, i) => (c.section === targetSection ? i : last),
        -1,
      );
      insertIndex = lastTarget === -1 ? afterRemoval.length : lastTarget + 1;
    }
  }

  const moved = { ...dragged, section: targetSection };
  const result = [...afterRemoval];
  result.splice(insertIndex, 0, moved);
  return result;
}
