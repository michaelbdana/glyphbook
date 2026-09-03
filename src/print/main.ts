import { Previewer } from "pagedjs";
import type { Book, ProseBlock, ProseInline } from "../shared/model/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineHtml(inlines: ProseInline[] | undefined): string {
  if (!inlines) return "";
  return inlines
    .map((i) => {
      const escaped = escapeHtml(i.text);
      const italics = i.marks?.some((m) => m.type === "italic");
      return italics ? `<em>${escaped}</em>` : escaped;
    })
    .join("");
}

function blockHtml(block: ProseBlock): string {
  if (block.type === "heading") {
    return `<h2 class="center">${inlineHtml(block.content)}</h2>`;
  }
  if (block.type !== "paragraph") {
    return "";
  }
  return `<p>${inlineHtml(block.content)}</p>`;
}

function bookHtml(book: Book): string {
  return book.chapters
    .map((chapter, index) => {
      const isFirst = index === 0;
      const titleClass = isFirst ? "title" : "chapter-title";
      const titleTag = isFirst ? "h1" : "h1";
      const body = (chapter.content.content ?? []).map(blockHtml).join("\n");
      return `
<section class="chapter${isFirst ? " first" : ""}" data-chapter="${escapeHtml(chapter.title)}">
  <${titleTag} class="${titleClass}">${escapeHtml(chapter.title)}</${titleTag}>
  ${body}
</section>`;
    })
    .join("\n");
}

async function run(): Promise<void> {
  const book = await window.glyphbook.getSpikeBook();
  document.title = `Rendering ${book.title}…`;
  const container = document.getElementById("book");
  if (!container) {
    throw new Error("Missing #book element");
  }
  container.innerHTML = bookHtml(book);

  const previewer = new Previewer();
  const flow = await previewer.preview();

  document.title = `Rendered ${flow.total} pages`;
  const outPath = await window.glyphbook.spikePrint();
  await window.glyphbook.showPrintResult(outPath);
}

void run().catch((err) => {
  document.title = `Print spike failed: ${String(err)}`;
  console.error(err);
});
