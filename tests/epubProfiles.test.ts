import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildEpubBuffer } from "../electron/exporters/epub";
import type { Book } from "../src/shared/model/types";

const now = new Date().toISOString();

function coverBook(): Book {
  const marker = Buffer.from("glyphbook-cover-marker").toString("base64");
  return {
    id: "test",
    title: "Profile Test",
    author: "Author",
    createdAt: now,
    updatedAt: now,
    chapters: [
      {
        id: "cover",
        title: "Cover",
        section: "front",
        numbered: false,
        kind: "cover",
        content: { type: "doc", content: [] },
        image: { src: `data:image/png;base64,${marker}`, alt: "" },
      },
      {
        id: "ch1",
        title: "Chapter One",
        section: "body",
        numbered: true,
        kind: "chapter",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Once upon a time." }],
            },
          ],
        },
      },
    ],
  };
}

async function fileNames(book: Book, profile: string): Promise<string[]> {
  const buffer = await buildEpubBuffer(book, { profile: profile as never });
  const zip = await JSZip.loadAsync(buffer);
  return Object.keys(zip.files);
}

describe("epub export profiles", () => {
  it("omits the interior cover page for Kindle", async () => {
    const names = await fileNames(coverBook(), "kindle");
    expect(names.some((n) => n.includes("cover"))).toBe(false);
    expect(names.some((n) => n.includes("toc.ncx"))).toBe(true);
  });

  it("keeps the cover embedded for Kobo and Generic", async () => {
    const kobo = await fileNames(coverBook(), "kobo");
    expect(kobo).toContain("OEBPS/cover.png");

    const generic = await fileNames(coverBook(), "generic");
    expect(generic).toContain("OEBPS/cover.png");
  });

  it("always produces valid structural files for every profile", async () => {
    for (const profile of ["kindle", "nook", "google", "apple", "kobo", "generic"]) {
      const names = await fileNames(coverBook(), profile);
      expect(names).toContain("mimetype");
      expect(names).toContain("META-INF/container.xml");
      expect(names).toContain("OEBPS/content.opf");
      expect(names).toContain("OEBPS/nav.xhtml");
      expect(names).toContain("OEBPS/toc.ncx");
    }
  });
});
