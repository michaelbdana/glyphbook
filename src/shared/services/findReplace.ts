import type { Book, Chapter, ProseDoc } from "../model/types";
import { countWordsInText } from "./wordCount";

export type ChapterMatch = { chapterId: string; title: string; count: number };

export type FindOptions = { caseSensitive?: boolean };

function countInNode(
  root: unknown,
  query: string,
  sensitive: boolean,
): number {
  let count = 0;
  const lowerQuery = sensitive ? query : query.toLowerCase();
  const scan = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) scan(item);
      return;
    }
    if (value && typeof value === "object") {
      const node = value as Record<string, unknown>;
      if (node.type === "text" && typeof node.text === "string") {
        const text = sensitive ? node.text : node.text.toLowerCase();
        if (lowerQuery) {
          count += text.split(lowerQuery).length - 1;
        }
      }
      if (Array.isArray(node.content)) scan(node.content);
    }
  };
  scan(root);
  return count;
}

export function findInChapter(
  chapter: Chapter,
  query: string,
  options: FindOptions = {},
): ChapterMatch | null {
  const count = countInNode(chapter.content, query, options.caseSensitive ?? false);
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

function transformNode(
  root: unknown,
  query: string,
  replacement: string,
  sensitive: boolean,
): { value: unknown; count: number } {
  if (Array.isArray(root)) {
    let count = 0;
    const mapped = root.map((item) => {
      const result = transformNode(item, query, replacement, sensitive);
      count += result.count;
      return result.value;
    });
    return { value: mapped, count };
  }
  if (root && typeof root === "object") {
    const node = root as Record<string, unknown>;
    const clone: Record<string, unknown> = { ...node };
    if (node.type === "text" && typeof node.text === "string") {
      const result = replaceInText(node.text, query, replacement, sensitive);
      clone.text = result.text;
      return { value: clone, count: result.count };
    }
    if (Array.isArray(node.content)) {
      const result = transformNode(node.content, query, replacement, sensitive);
      clone.content = result.value;
      return { value: clone, count: result.count };
    }
    return { value: clone, count: 0 };
  }
  return { value: root, count: 0 };
}

export function replaceInDoc(
  doc: ProseDoc,
  query: string,
  replacement: string,
  options: FindOptions = {},
): { doc: ProseDoc; replaced: number } {
  const result = transformNode(
    doc,
    query,
    replacement,
    options.caseSensitive ?? false,
  );
  return { doc: result.value as ProseDoc, replaced: result.count };
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
    return result.replaced > 0 ? { ...chapter, content: result.doc } : chapter;
  });
  return { chapters, replaced };
}

export { countWordsInText };
