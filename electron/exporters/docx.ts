import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { Book, ProseInline } from "../../src/shared/model/types";

function runs(inlines: ProseInline[] | undefined): TextRun[] {
  return (inlines ?? []).map((inline) => {
    const bold = inline.marks?.some((m) => m.type === "bold");
    const italic = inline.marks?.some((m) => m.type === "italic");
    return new TextRun({
      text: inline.text,
      bold,
      italics: italic,
    });
  });
}

function chapterParagraphs(chapter: Book["chapters"][number]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: chapter.title })],
    }),
  );
  for (const block of chapter.content.content ?? []) {
    if (block.type === "paragraph") {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 360 },
          spacing: { after: 120 },
          children: runs(block.content),
        }),
      );
    } else if (block.type === "heading") {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: runs(block.content),
        }),
      );
    }
  }
  return paragraphs;
}

export async function buildDocxBuffer(book: Book): Promise<Buffer> {
  const paragraphs: Paragraph[] = [];
  for (const chapter of book.chapters) {
    paragraphs.push(...chapterParagraphs(chapter));
  }
  const doc = new Document({
    creator: book.author,
    title: book.title,
    description: "Glyphbook export",
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });
  return Packer.toBuffer(doc);
}
