import mammoth from "mammoth";
import type { Book, Chapter, ProseBlock, ProseDoc, ProseInline } from "../../src/shared/model/types";

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function unescape(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function inlineHtml(html: string): ProseInline[] {
  const cleaned = unescape(html);
  const inline: ProseInline[] = [];
  const pattern = /<strong>|<b>|<em>|<i>|<\/strong>|<\/b>|<\/em>|<\/i>/g;
  let lastIndex = 0;
  let bold = false;
  let italic = false;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(cleaned)) !== null) {
    const start = match.index;
    if (start > lastIndex) {
      const text = cleaned.slice(lastIndex, start);
      if (text) inline.push({ type: "text", text, marks: marks(bold, italic) });
    }
    const token = match[0];
    if (token === "<strong>" || token === "<b>") bold = true;
    else if (token === "</strong>" || token === "</b>") bold = false;
    else if (token === "<em>" || token === "<i>") italic = true;
    else if (token === "</em>" || token === "</i>") italic = false;
    lastIndex = match.index + token.length;
  }
  if (lastIndex < cleaned.length) {
    const text = cleaned.slice(lastIndex);
    if (text) inline.push({ type: "text", text, marks: marks(bold, italic) });
  }
  return inline;
}

function marks(bold: boolean, italic: boolean): ProseInline["marks"] {
  const list: NonNullable<ProseInline["marks"]> = [];
  if (bold) list.push({ type: "bold" });
  if (italic) list.push({ type: "italic" });
  return list.length ? list : undefined;
}

function blocksFromHtml(html: string): ProseBlock[] {
  const blocks: ProseBlock[] = [];
  const element =
    /<(p|h1|h2|h3|h4|h5|h6|li)[^>]*>([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;
  const textRe = /<[^>]+>/g;
  while ((match = element.exec(html)) !== null) {
    const tag = match[1];
    const content = match[2].replace(textRe, "");
    if (tag === "p" || tag === "li") {
      const inlines = inlineHtml(content);
      if (inlines.length) blocks.push({ type: "paragraph", content: inlines });
    } else {
      const level = Math.min(Math.max(Number(tag[1]), 2), 6);
      const inlines = inlineHtml(content);
      if (inlines.length) blocks.push({ type: "heading", attrs: { level }, content: inlines });
    }
  }
  return blocks;
}

function emptyChapter(title: string, section: "front" | "body"): Chapter {
  return { id: newId(), title, section, numbered: section === "body", kind: section === "body" ? "chapter" : "page", content: { type: "doc", content: [] } };
}

export async function parseDocx(
  buffer: Buffer,
  defaultTitle: string,
): Promise<Book> {
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;

  const sections: { title: string; html: string }[] = [];
  const headingPattern = /<h1[^>]*>([\s\S]*?)<\/h1>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(html)) !== null) {
    const title = unescape(match[1].replace(/<[^>]+>/g, "").trim());
    const before = html.slice(lastIndex, match.index).trim();
    if (before) sections.push({ title: "", html: before });
    sections.push({ title: title || "", html: "" });
    lastIndex = match.index + match[0].length;
  }
  const tail = html.slice(lastIndex).trim();
  if (tail) sections.push({ title: "", html: tail });
  if (sections.length === 0) {
    sections.push({ title: defaultTitle || "Chapter 1", html });
  }

  const now = new Date().toISOString();
  const front: Chapter[] = [
    { ...emptyChapter("Title Page", "front"), kind: "title" },
    { ...emptyChapter("Copyright", "front"), kind: "copyright" },
    { ...emptyChapter("Table of Contents", "front"), kind: "toc" },
  ];
  const body: Chapter[] = [];

  for (const section of sections) {
    const content: ProseDoc = { type: "doc", content: blocksFromHtml(section.html) };
    if (!section.title) {
      if (!content.content || content.content.length === 0) continue;
      const opening: Chapter = { ...emptyChapter("Front Matter", "front"), content };
      front.push(opening);
      continue;
    }
    body.push({
      ...emptyChapter(section.title, "body"),
      numbered: true,
      content,
    });
  }

  return {
    id: newId(),
    title: defaultTitle || "Imported Book",
    author: "Imported",
    createdAt: now,
    updatedAt: now,
    chapters: [...front, ...body],
  };
}
