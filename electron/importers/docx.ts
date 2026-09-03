import JSZip from "jszip";
import type {
  Book,
  Chapter,
  ProseBlock,
  ProseDoc,
  ProseInline,
} from "../../src/shared/model/types";
import { isLikelyBoundary, cleanTitle, type BoundaryKind } from "../../src/shared/services/outline";

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

type Segment = { text: string; bold: boolean; italic: boolean };

type Para = {
  segments: Segment[];
  text: string;
  styleLevel: number;
  pageBreak: boolean;
  pageBreakBefore: boolean;
  centered: boolean;
};

function emptyChapter(title: string, section: "front" | "body" | "back"): Chapter {
  return {
    id: newId(),
    title,
    section,
    numbered: section === "body",
    kind: section === "body" ? "chapter" : "page",
    content: { type: "doc", content: [] },
  };
}

type RunFlags = { bold?: boolean; italic?: boolean };

function mergeFlags(base: RunFlags, over: RunFlags): RunFlags {
  const result = { ...base };
  if (over.bold !== undefined) result.bold = over.bold;
  if (over.italic !== undefined) result.italic = over.italic;
  return result;
}

function parseOnOff(xml: string, tag: "b" | "i"): boolean | undefined {
  const match = xml.match(new RegExp(`<w:${tag}\\b[^>]*/?>`));
  if (!match) return undefined;
  return /w:val="(?:0|false)"/.test(match[0]) ? false : true;
}

function rPrFlags(container: string): RunFlags {
  const rPr = container.match(/<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>/);
  if (!rPr) return {};
  return { bold: parseOnOff(rPr[0], "b"), italic: parseOnOff(rPr[0], "i") };
}

type StyleDef = { basedOn?: string; flags: RunFlags };

function parseStyles(xml: string): Map<string, StyleDef> {
  const map = new Map<string, StyleDef>();
  const styles = xml.match(/<w:style\b[^>]*>[\s\S]*?<\/w:style>/g) ?? [];
  for (const style of styles) {
    const id = style.match(/w:styleId="([^"]+)"/);
    if (!id) continue;
    const basedOn = style.match(/<w:basedOn w:val="([^"]+)"/);
    map.set(id[1], {
      basedOn: basedOn ? basedOn[1] : undefined,
      flags: rPrFlags(style),
    });
  }
  return map;
}

function styleChainFlags(
  styles: Map<string, StyleDef>,
  id: string | undefined,
  memo: Map<string, RunFlags>,
): RunFlags {
  if (!id || !styles.has(id)) return {};
  if (memo.has(id)) return memo.get(id)!;
  const def = styles.get(id)!;
  const parent = styleChainFlags(styles, def.basedOn, memo);
  const flags = mergeFlags(parent, def.flags);
  memo.set(id, flags);
  return flags;
}

function runXmlText(run: string): string {
  let text = "";
  const nodes = run.match(/<w:t(?: [^>]*)?>[\s\S]*?<\/w:t>/g) ?? [];
  for (const node of nodes) {
    text += node.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>$/, "");
  }
  if (/<w:tab\b/.test(run)) text = ` ${text}`;
  return text;
}

function parseParagraphs(
  xml: string,
  styles: Map<string, StyleDef>,
): Para[] {
  const raw = xml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) ?? [];
  const paras: Para[] = [];
  const memo = new Map<string, RunFlags>();

  for (const p of raw) {
    const style = p.match(/<w:pStyle w:val="([^"]+)"/);
    const styleName = style ? style[1] : "";
    const levelMatch = styleName.match(/Heading([1-9])/i);
    const styleLevel = levelMatch ? Number(levelMatch[1]) : 0;

    const centered = /<w:jc w:val="center"/.test(p);
    let pageBreak = false;

    const pPr = p.match(/<w:pPr\b[^>]*>[\s\S]*?<\/w:pPr>/);
    const paraBase = mergeFlags(
      styleChainFlags(styles, styleName, memo),
      rPrFlags(pPr ? pPr[0] : ""),
    );

    const segments: Segment[] = [];
    const runs = p.match(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/g) ?? [];
    for (const run of runs) {
      if (/<w:br w:type="page"/.test(run) || /<w:br\s+w:type='page'/.test(run)) {
        pageBreak = true;
      }
      const runPr = run.match(/<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>/);
      const runRpr = runPr ? runPr[0] : "";
      const charStyle = runRpr.match(/<w:rStyle w:val="([^"]+)"/);
      const eff = mergeFlags(
        paraBase,
        mergeFlags(
          styleChainFlags(styles, charStyle ? charStyle[1] : undefined, memo),
          rPrFlags(runRpr),
        ),
      );

      const text = runXmlText(run);
      if (text) {
        segments.push({
          text,
          bold: eff.bold === true,
          italic: eff.italic === true,
        });
      }
    }

    const text = cleanTitle(segments.map((s) => s.text).join(""));
    if (!text && !pageBreak && styleLevel === 0) continue;

    paras.push({ segments, text, styleLevel, pageBreak, pageBreakBefore: false, centered });
  }

  let pendingBreak = false;
  for (const para of paras) {
    para.pageBreakBefore = pendingBreak || para.pageBreak;
    pendingBreak = para.pageBreak;
    if (para.text || para.styleLevel > 0) pendingBreak = false;
  }
  return paras;
}

function paragraphBlocks(para: Para, styleLevel: number): ProseBlock[] {
  const inlines: ProseInline[] = [];
  for (const seg of para.segments) {
    if (!seg.text) continue;
    const marks: NonNullable<ProseInline["marks"]> = [];
    if (seg.bold) marks.push({ type: "bold" });
    if (seg.italic) marks.push({ type: "italic" });
    inlines.push({ type: "text", text: seg.text, marks: marks.length ? marks : undefined });
  }
  if (inlines.length === 0) return [];

  if (styleLevel >= 2 && para.text.length <= 90 && !/[.!?…]$/.test(para.text)) {
    const level = Math.min(styleLevel, 6);
    return [{ type: "heading", attrs: { level }, content: inlines }];
  }
  return [{ type: "paragraph", content: inlines }];
}

function standardFront(): Chapter[] {
  return [
    { ...emptyChapter("Title Page", "front"), kind: "title" },
    { ...emptyChapter("Copyright", "front"), kind: "copyright" },
    { ...emptyChapter("Table of Contents", "front"), kind: "toc" },
  ];
}

function segmentParas(paras: Para[]): {
  docTitle: string;
  frontParagraphs: Para[];
  chapters: { title: string; numbered: boolean; section: "front" | "body" | "back"; paras: Para[] }[];
} {
  const docTitlePara = paras.find((p) => p.styleLevel === 1 && p.text);
  const docTitle = docTitlePara ? docTitlePara.text : "";
  const startIndex = docTitlePara ? paras.indexOf(docTitlePara) + 1 : 0;

  const frontParagraphs: Para[] = [];
  const chapters: {
    title: string;
    numbered: boolean;
    section: "front" | "body" | "back";
    paras: Para[];
  }[] = [];
  let current: (typeof chapters)[number] | null = null;
  let currentBuffer: Para[] = [];

  const commit = () => {
    if (current) {
      current.paras = currentBuffer;
      chapters.push(current);
    }
    currentBuffer = [];
    current = null;
  };

  for (const para of paras.slice(startIndex)) {
    if (!para.text && !para.pageBreakBefore) continue;
    const kind: BoundaryKind = isLikelyBoundary({
      text: para.text,
      styleLevel: para.styleLevel,
      pageBreakBefore: para.pageBreakBefore,
      centered: para.centered,
      isFirstParagraph: false,
    });

    if (!kind) {
      if (current) currentBuffer.push(para);
      else frontParagraphs.push(para);
      continue;
    }

    commit();
    current = {
      title: para.text || "Chapter",
      numbered: kind === "chapter",
      section: kind === "back" ? "back" : "body",
      paras: [],
    };
  }
  commit();

  return { docTitle, frontParagraphs, chapters };
}

function imageMime(name: string): string | null {
  const ext = name.toLowerCase();
  if (ext.endsWith(".png")) return "image/png";
  if (ext.endsWith(".gif")) return "image/gif";
  if (ext.endsWith(".webp")) return "image/webp";
  if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) return "image/jpeg";
  return null;
}

async function extractCover(
  zip: JSZip,
  docXml: string,
): Promise<Book["cover"]> {
  const firstEmbed = docXml.match(/<w:drawing[\s\S]*?r:embed="([^"]+)"/);
  if (!firstEmbed) return undefined;
  const relsEntry = zip.file("word/_rels/document.xml.rels");
  if (!relsEntry) return undefined;
  const rels = await relsEntry.async("string");
  const relMatch = rels.match(
    new RegExp(`<Relationship[^>]*Id="${firstEmbed[1]}"[^>]*Target="([^"]+)"`),
  );
  if (!relMatch) return undefined;
  const target = relMatch[1];
  const mediaEntry = zip.file(`word/${target}`);
  if (!mediaEntry) return undefined;
  const mime = imageMime(target);
  if (!mime) return undefined;
  const bytes = await mediaEntry.async("uint8array");
  return {
    src: `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`,
    alt: "",
  };
}

export async function parseDocx(
  buffer: Buffer,
  defaultTitle: string,
): Promise<Book> {
  const zip = await JSZip.loadAsync(buffer);
  const entry = zip.file("word/document.xml");
  if (!entry) throw new Error("Not a valid .docx file (missing document.xml)");
  const xml = await entry.async("string");

  let styles = new Map<string, StyleDef>();
  const stylesEntry = zip.file("word/styles.xml");
  if (stylesEntry) {
    styles = parseStyles(await stylesEntry.async("string"));
  }

  const paras = parseParagraphs(xml, styles);
  const { docTitle, frontParagraphs, chapters } = segmentParas(paras);
  const cover = await extractCover(zip, xml);

  const now = new Date().toISOString();
  const front: Chapter[] = standardFront();

  const bodyChapters: Chapter[] = chapters
    .filter((c) => c.section === "body")
    .map((c) => {
      const content: ProseDoc = {
        type: "doc",
        content: c.paras.flatMap((p) => paragraphBlocks(p, p.styleLevel)),
      };
      return {
        ...emptyChapter(c.title, "body"),
        numbered: c.numbered,
        content,
      };
    });
  const backChapters: Chapter[] = chapters
    .filter((c) => c.section === "back")
    .map((c) => {
      const content: ProseDoc = {
        type: "doc",
        content: c.paras.flatMap((p) => paragraphBlocks(p, p.styleLevel)),
      };
      return { ...emptyChapter(c.title, "back"), content };
    });

  if (bodyChapters.length === 0) {
    const content: ProseDoc = {
      type: "doc",
      content: [...frontParagraphs, ...chapters.flatMap((c) => c.paras)].flatMap((p) =>
        paragraphBlocks(p, p.styleLevel),
      ),
    };
    bodyChapters.push({
      ...emptyChapter(docTitle || defaultTitle || "Chapter 1", "body"),
      numbered: true,
      content,
    });
  } else {
    const frontContent: ProseDoc = {
      type: "doc",
      content: frontParagraphs.flatMap((p) => paragraphBlocks(p, p.styleLevel)),
    };
    if (frontContent.content && frontContent.content.length > 0) {
      front.push({ ...emptyChapter("Front Matter", "front"), content: frontContent });
    }
  }

  return {
    id: newId(),
    title: docTitle || defaultTitle || "Imported Book",
    author: "Imported",
    createdAt: now,
    updatedAt: now,
    chapters: [...front, ...bodyChapters, ...backChapters],
    cover,
  };
}
