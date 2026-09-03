import type { ProseDoc } from "../model/types";

export function countWords(doc: ProseDoc): number {
  let count = 0;
  for (const block of doc.content ?? []) {
    if (block.type !== "paragraph" && block.type !== "heading") continue;
    for (const inline of block.content ?? []) {
      if (inline.type === "text") {
        const words = inline.text.split(/\s+/).filter((w) => w.length > 0);
        count += words.length;
      }
    }
  }
  return count;
}

export function countWordsInText(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}
