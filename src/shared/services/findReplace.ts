import type { Book, Chapter, ProseBlock, ProseDoc } from "../model/types";

export type ChapterMatch = { chapterId: string; title: string; count: number };

export type FindOptions = { caseSensitive?: boolean };

function countOccurrences(text: string, query: string, sensitive: boolean): number {
  if (!query) return 0;
  if (sensitive) return text.split(query).length - 1;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  return lowerText.split(lowerQuery).length - 1;
}

export function findInChapter(
  chapter: Chapter,
  query: string,
  options: FindOptions = {},
): ChapterMatch | null {
  const sensitive = options.caseSensitive ?? false;
  let count = 0;
  for (const block of chapter.content.content ?? []) {
    if (block.type !== "paragraph" && block.type !== "heading") continue;
    for (const inline of block.content ?? []) {
      if (inline.type === "text") {
        count += countOccurrences(inline.text, query, sensitive);
      }
    }
  }
  return count > 0
    ? { chapterId: chapter.id, title: chapter.title, count }
    : null;
}

export function findInBook(
  book: Book,
  query: string,
  options: FindOptions = {},
): ChapterMatch[] {
  const results: ChapterMatch[] = [];
  for (const chapter of book.chapters) {
    const match = findInChapter(chapter, query, options);
    if (match) results.push(match);
  }
  return results;
}

export function replaceInText(
  text: string,
  query: string,
  replacement: string,
  sensitive: boolean,
): { text: string; count: number } {
  if (!query) return { text, count: 0 };
  if (sensitive) {
    const parts = text.split(query);
    return { text: parts.join(replacement), count: parts.length - 1 };
  }
  const lower = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const result: string[] = [];
  let count = 0;
  let index = 0;
  while (index < text.length) {
    const at = lower.indexOf(lowerQuery, index);
    if (at === -1) {
      result.push(text.slice(index));
      break;
    }
    result.push(text.slice(index, at));
    result.push(replacement);
    count += 1;
    index = at + query.length;
  }
  return { text: result.join(""), count };
}

export function replaceInDoc(
  doc: ProseDoc,
  query: string,
  replacement: string,
  options: FindOptions = {},
): { doc: ProseDoc; replaced: number } {
  const sensitive = options.caseSensitive ?? false;
  let replaced = 0;
  const content: ProseBlock[] = (doc.content ?? []).map((block) => {
    if (block.type !== "paragraph" && block.type !== "heading") return block;
    const inlines = (block.content ?? []).map((inline) => {
      if (inline.type !== "text") return inline;
      const result = replaceInText(
        inline.text,
        query,
        replacement,
        sensitive,
      );
      replaced += result.count;
      return result.count > 0 ? { ...inline, text: result.text } : inline;
    });
    return { ...block, content: inlines };
  });
  return { doc: { type: "doc", content }, replaced };
}

export function replaceInBook(
  book: Book,
  query: string,
  replacement: string,
  options: FindOptions = {},
): { chapters: Chapter[]; replaced: number } {
  let replaced = 0;
  const chapters = book.chapters.map((chapter) => {
    const result = replaceInDoc(chapter.content, query, replacement, options);
    replaced += result.replaced;
    return result.replaced > 0
      ? { ...chapter, content: result.doc }
      : chapter;
  });
  return { chapters, replaced };
}
