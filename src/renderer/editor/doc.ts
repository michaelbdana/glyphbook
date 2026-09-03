import type { ProseDoc, ProseInline } from "../../shared/model/types";

export function emptyDoc(): ProseDoc {
  return { type: "doc", content: [] };
}

export function textBlock(text: string): ProseInline {
  return { type: "text", text };
}
