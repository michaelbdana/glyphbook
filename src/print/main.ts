import { Previewer } from "pagedjs";
import type { Book } from "../shared/model/types";
import { mergeTheme } from "../shared/model/theme";
import { compilePrintCss } from "../shared/services/themeCss";
import { buildBodyHtml } from "../shared/services/ebookHtml";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chapterHtml(book: Book): string {
  return book.chapters
    .map((chapter, index) => {
      const isFirst = index === 0;

      if (
        (chapter.kind === "fullpage" || chapter.kind === "cover") &&
        chapter.image?.src
      ) {
        const img = chapter.image;
        return `
<section class="chapter${isFirst ? " first" : ""} fullpage" data-chapter="image">
  <img src="${escapeHtml(img.src)}" alt="${escapeHtml(
            img.alt ?? "",
          )}" class="fullpage-image" />
</section>`;
      }

      const titleClass = isFirst ? "title" : "chapter-title";
      const body = buildBodyHtml(chapter.content);
      return `
<section class="chapter${isFirst ? " first" : ""}" data-chapter="${escapeHtml(chapter.title)}">
  <h1 class="${titleClass}">${escapeHtml(chapter.title)}</h1>
  ${body}
</section>`;
    })
    .join("\n");
}

function injectThemeCss(book: Book): void {
  const theme = mergeTheme(book.themeName, book.theme);
  const style = document.createElement("style");
  style.textContent = compilePrintCss(theme, { bookTitle: book.title });
  document.head.appendChild(style);
}

async function run(): Promise<void> {
  const book = await window.glyphbook.getSpikeBook();
  document.title = `Rendering ${book.title}…`;
  const container = document.getElementById("book");
  if (!container) {
    throw new Error("Missing #book element");
  }
  container.innerHTML = chapterHtml(book);
  injectThemeCss(book);

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
