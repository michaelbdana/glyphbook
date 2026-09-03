import type { ProseBlock, ProseDoc } from "../model/types";

type QuoteState = { doubleOpen: boolean; singleOpen: boolean };

function isWordChar(char: string): boolean {
  return /[\p{L}\p{N}]/u.test(char);
}

export function transformText(
  text: string,
  state: QuoteState,
): { text: string; count: number } {
  let out = "";
  let count = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (state.doubleOpen) {
        out += "\u201D";
        state.doubleOpen = false;
      } else {
        out += "\u201C";
        state.doubleOpen = true;
      }
      count += 1;
      continue;
    }
    if (char === "'") {
      const prev = text[i - 1];
      const next = text[i + 1];
      if (prev && next && isWordChar(prev) && isWordChar(next)) {
        out += "\u2019";
      } else if (state.singleOpen) {
        out += "\u2019";
        state.singleOpen = false;
      } else {
        out += "\u2018";
        state.singleOpen = true;
      }
      count += 1;
      continue;
    }
    out += char;
  }
  return { text: out, count };
}

export function transformDoc(doc: ProseDoc): { doc: ProseDoc; count: number } {
  const state: QuoteState = { doubleOpen: false, singleOpen: false };
  let count = 0;
  const content: ProseBlock[] = (doc.content ?? []).map((block) => {
    if (block.type !== "paragraph" && block.type !== "heading") return block;
    const inlines = (block.content ?? []).map((inline) => {
      if (inline.type !== "text") return inline;
      const result = transformText(inline.text, state);
      count += result.count;
      return result.count > 0 ? { ...inline, text: result.text } : inline;
    });
    return { ...block, content: inlines };
  });
  return { doc: { type: "doc", content }, count };
}
