import JSZip from "jszip";
import type { Book } from "../../src/shared/model/types";
import type { BookTheme } from "../../src/shared/model/theme";
import { mergeTheme } from "../../src/shared/model/theme";
import { ebookChapterHtml } from "../../src/shared/services/ebookHtml";
import { epubProfile, type EpubProfileId } from "../../src/shared/model/epubProfiles";
import { escapeXml } from "../xml";

export type EpubExportOptions = {
  profile?: EpubProfileId;
};

function coverFileInfo(src: string): { name: string; mime: string } | null {
  const match = src.match(/^data:([^;]+);base64,/);
  if (!match) return null;
  const mime = match[1];
  const ext =
    mime === "image/png"
      ? "png"
      : mime === "image/gif"
        ? "gif"
        : mime === "image/webp"
          ? "webp"
          : mime === "image/jpeg"
            ? "jpg"
            : null;
  if (!ext) return null;
  return { name: `cover.${ext}`, mime };
}

function ebookCss(theme: BookTheme): string {
  const para =
    theme.paragraphStart === "indent"
      ? "p { text-indent: 1.5em; margin: 0 0 0.35em; }"
      : "p { margin: 0 0 1em; text-indent: 0; }";
  return `body {
  font-family: ${theme.bodyFontFamily};
  font-size: ${theme.bodyFontSizePt}pt;
  line-height: ${theme.lineHeight};
  ${theme.justify ? "text-align: justify;" : "text-align: left;"}
  color: #111;
  margin: 0; padding: 0;
}
h1 { font-family: ${theme.headingFontFamily}; text-align: center; line-height: 1.2; }
h2 { font-family: ${theme.headingFontFamily}; text-align: center; }
p { orphans: 2; widows: 2; }
.chapter-wrap { margin-top: 1.2em; }
img { max-width: 100%; height: auto; }
figure { text-align: center; margin: 1em 0; }
${para}
`;
}

function spineChapters(book: Book): Book["chapters"] {
  return book.chapters.filter(
    (c) => (c.options?.includeIn ?? "all") === "all" || c.options?.includeIn === "ebook",
  );
}

export async function buildEpubBuffer(
  book: Book,
  options: EpubExportOptions = {},
): Promise<Buffer> {
  const profile = epubProfile(options.profile ?? "generic");
  const theme = mergeTheme(book.themeName, book.theme);
  const chapters = spineChapters(book).filter(
    (c) => profile.includeCoverPage || c.kind !== "cover",
  );
  const zip = new JSZip();

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
  );

  const css = ebookCss(theme);
  const chapterFiles: string[] = [];
  const navPoints: string[] = [];
  const manifestItems: string[] = [];
  const spine: string[] = [];

  chapters.forEach((chapter, index) => {
    const id = `ch${index}`;
    const href = `chap${index}.xhtml`;
    chapterFiles.push(href);
    const html = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapeXml(chapter.title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><div class="chapter-wrap">${ebookChapterHtml(chapter, index === 0, true)}</div></body>
</html>`;
    zip.file(`OEBPS/${href}`, html);

    const showInToc =
      chapter.kind !== "cover" &&
      !chapter.options?.hideToc &&
      (chapter.options?.includeIn ?? "all") !== "none";
    manifestItems.push(`<item id="${id}" href="${href}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="${id}"/>`);
    if (showInToc) {
      navPoints.push(`<navPoint id="np${index}" playOrder="${index + 1}">
  <navLabel><text>${escapeXml(chapter.title)}</text></navLabel>
  <content src="${href}"/></navPoint>`);
    }
  });

  const coverSrc =
    book.cover?.src ??
    chapters.find((c) => c.kind === "cover")?.image?.src;
  let coverMeta = "";
  if (coverSrc) {
    const info = coverFileInfo(coverSrc);
    if (info) {
      const data = coverSrc.split(",")[1];
      if (data) {
        zip.file(`OEBPS/${info.name}`, Buffer.from(data, "base64"));
        manifestItems.push(
          `<item id="cover-img" href="${info.name}" media-type="${info.mime}" properties="cover-image"/>`,
        );
        coverMeta = '<meta name="cover" content="cover-img"/>';
      }
    }
  }

  zip.file(
    "OEBPS/style.css",
    css,
  );
  manifestItems.unshift(`<item id="css" href="style.css" media-type="text/css"/>`);
  manifestItems.push(`<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`);
  const opfItems = manifestItems.join("\n    ");
  const spineRefs = spine.join("\n    ");

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:glyphbook-${book.id}</dc:identifier>
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator>${escapeXml(book.author)}</dc:creator>
    <dc:language>en</dc:language>
    ${coverMeta}
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    ${opfItems}
  </manifest>
  <spine toc="ncx">
    ${spineRefs}
  </spine>
</package>`,
  );

  const navHtml = chapters
    .map((chapter, index) => {
      const showInToc =
        chapter.kind !== "cover" &&
        !chapter.options?.hideToc &&
        (chapter.options?.includeIn ?? "all") !== "none";
      return showInToc
        ? `<li><a href="chap${index}.xhtml">${escapeXml(chapter.title)}</a></li>`
        : "";
    })
    .filter(Boolean)
    .join("\n");
  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body><nav epub:type="toc"><h1>Table of Contents</h1><ol>${navHtml}</ol></nav></body>
</html>`,
  );

  const ncxPoints = navPoints.join("\n");
  zip.file(
    "OEBPS/toc.ncx",
    `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="glyphbook-${book.id}"/></head>
  <docTitle><text>${escapeXml(book.title)}</text></docTitle>
  <navMap>${ncxPoints}</navMap>
</ncx>`,
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });
  return Buffer.from(buffer);
}

export { spineChapters };
