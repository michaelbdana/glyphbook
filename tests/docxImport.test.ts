import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import JSZip from "jszip";
import { parseDocx } from "../electron/importers/docx";

const fixture = path.join(__dirname, "..", "AccidentalSorceress-master.docx");
const hasFixture = fs.existsSync(fixture);

describe("docx style preservation", () => {
  function inlineMarksOfParagraphs(book: {
    chapters: Array<{ content: { content?: unknown[] } }>;
  }): string[] {
    const marks: string[] = [];
    for (const chapter of book.chapters) {
      for (const block of chapter.content.content ?? []) {
        const b = block as { type?: string; content?: unknown[] };
        if (b.type !== "paragraph") continue;
        const inner = (b.content ?? []) as Array<{
          type?: string;
          text?: string;
          marks?: Array<{ type: string }>;
        }>;
        for (const inline of inner) {
          marks.push(`${inline.marks?.map((m) => m.type).sort().join(",") ?? ""}:${inline.text}`);
        }
      }
    }
    return marks;
  }

  it("preserves italics from paragraph styles, character styles, and direct formatting", async () => {
    const docXml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
      <w:p><w:r><w:t xml:space="preserve">plain text sentence.</w:t></w:r></w:p>
      <w:p><w:pPr><w:pStyle w:val="ItalicPara"/></w:pPr><w:r><w:t xml:space="preserve">entire paragraph italic.</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:rStyle w:val="Emphasis"/></w:rPr><w:t xml:space="preserve">styled italic word</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">direct bold word</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:rStyle w:val="Fancy"/></w:rPr><w:t xml:space="preserve">styled bold italic word</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:rStyle w:val="Emphasis"/></w:rPr><w:t xml:space="preserve">not really </w:t></w:r><w:r><w:rPr><w:i w:val="0"/></w:rPr><w:t xml:space="preserve">not italic</w:t></w:r></w:p>
    </w:body></w:document>`;
    const stylesXml = `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:style w:type="paragraph" w:styleId="ItalicPara"><w:rPr><w:i/></w:rPr></w:style>
      <w:style w:type="character" w:styleId="Emphasis"><w:rPr><w:i/></w:rPr></w:style>
      <w:style w:type="character" w:styleId="Fancy"><w:basedOn w:val="Emphasis"/><w:rPr><w:b/></w:rPr></w:style>
    </w:styles>`;

    const zip = new JSZip();
    zip.file("word/document.xml", docXml);
    zip.file("word/styles.xml", stylesXml);
    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    const book = await parseDocx(Buffer.from(buffer), "Styled Test");
    const marks = inlineMarksOfParagraphs(book);

    expect(marks[0]).toBe(":plain text sentence.");
    expect(marks[1]).toBe("italic:entire paragraph italic.");
    expect(marks[2]).toBe("italic:styled italic word");
    expect(marks[3]).toBe("bold:direct bold word");
    expect(marks[4]).toBe("bold,italic:styled bold italic word");
    expect(marks[5]).toBe("italic:not really ");
    expect(marks[6]).toBe(":not italic");
  });
});

describe.skipIf(!hasFixture)("docx import", () => {
  it("parses the fixture book and recognizes its chapters", async () => {
    const buffer = fs.readFileSync(fixture);
    const book = await parseDocx(buffer, "AccidentalSorceress");

    const body = book.chapters.filter((c) => c.section === "body");
    expect(body.length).toBeGreaterThanOrEqual(28);

    expect(book.cover?.src).toMatch(/^data:image\/jpeg;base64,/);
    const firstFront = book.chapters.find((c) => c.section === "front");
    expect(firstFront?.kind).toBe("cover");
    expect(firstFront?.image?.src).toBe(book.cover?.src);

    const titles = body.map((c) => c.title);
    expect(titles[0]).toBe("Chapter One");
    expect(titles[1]).toBe("Chapter Two");
    expect(titles[titles.length - 1]).toBe("Chapter Twenty-Eight");

    const words = (chapter: (typeof body)[number]) =>
      chapter.content.content?.reduce((n, b) => {
        if (b.type !== "paragraph") return n;
        return n + (b.content ?? []).reduce((m, i) => m + i.text.split(/\s+/).filter(Boolean).length, 0);
      }, 0) ?? 0;

    const totalWords = body.reduce((n, c) => n + words(c), 0);
    expect(totalWords).toBeGreaterThan(50000);
    expect(body.every((c) => c.content.content && c.content.content.length > 0)).toBe(true);
  }, 60000);
});
