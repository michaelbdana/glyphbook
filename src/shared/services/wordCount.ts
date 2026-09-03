import type { ProseDoc } from "../model/types";

function forEachText(root: unknown, callback: (text: string) => void): void {
  if (Array.isArray(root)) {
    for (const item of root) forEachText(item, callback);
    return;
  }
  if (root && typeof root === "object") {
    const node = root as Record<string, unknown>;
    if (node.type === "text" && typeof node.text === "string") {
      callback(node.text);
    }
    if (Array.isArray(node.content)) forEachText(node.content, callback);
  }
}

export function countWords(doc: ProseDoc): number {
  let count = 0;
  forEachText(doc, (text) => {
    count += text.split(/\s+/).filter((w) => w.length > 0).length;
  });
  return count;
}

export function countWordsInText(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}
