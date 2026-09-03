import type { Book } from "./types";

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function paragraphs(
  ...texts: string[]
): Book["chapters"][number]["content"] {
  return {
    type: "doc",
    content: texts.map((text) => ({
      type: "paragraph",
      content: text ? [{ type: "text", text }] : undefined,
    })),
  };
}

export function buildSampleBook(): Book {
  const now = new Date().toISOString();
  const chapter = (title: string, ...texts: string[]) => ({
    id: newId(),
    title,
    section: "body" as const,
    numbered: true,
    kind: "chapter" as const,
    content: paragraphs(...texts),
  });

  return {
    id: newId(),
    title: "The Lighthouse Keeper",
    author: "Sample Author",
    projectName: "Novel",
    version: "Draft 1",
    createdAt: now,
    updatedAt: now,
    chapters: [
      {
        id: newId(),
        title: "Title Page",
        section: "front",
        numbered: false,
        kind: "title",
        content: paragraphs("The Lighthouse Keeper", "by Sample Author"),
      },
      {
        id: newId(),
        title: "Copyright",
        section: "front",
        numbered: false,
        kind: "copyright",
        content: paragraphs(
          "Copyright © 2026 Sample Author",
          "All rights reserved.",
        ),
      },
      {
        id: newId(),
        title: "Table of Contents",
        section: "front",
        numbered: false,
        kind: "toc",
        content: paragraphs(),
      },
      chapter(
        "Chapter One",
        "The wind arrived before the rain did, tearing across the headland in long, hungry gusts. Mara pulled her oilskin collar tight and leaned into the slope, one hand on the iron rail that ran from the cottage to the lantern room.",
        "Forty years her father had climbed these steps. Now they were hers, and she had counted every one of them each night since the storm took his boat. The lamp needed its oil, the lens its polish, and the sea needed watching - always watching.",
        "Below, the harbor lights winked against the dark. Somewhere out there, past the breakwater, a ship was making for shelter. Mara hoped it would find its way.",
      ),
      chapter(
        "Chapter Two",
        "By morning the storm had spent itself, leaving the sky scrubbed clean and the tideline littered with the sea's leavings. Mara walked the beach with a burlap sack, gathering what the waves had given up.",
        "She found the bottle first, wedged between two rocks and corked against the weather. The paper inside was dry, the ink still sharp. It was a map, drawn in a hand she did not recognize, marked with a cove she had never heard of.",
        "The cove did not exist, she knew that. She had charted every inlet on this coast since she was twelve. But the map was new, and it named the island - her island - and that was impossible.",
      ),
      {
        id: newId(),
        title: "About the Author",
        section: "back",
        numbered: false,
        kind: "about",
        content: paragraphs(
          "Sample Author lives by the sea and writes at night, when the house is quiet and the wind has nothing left to prove.",
        ),
      },
    ],
  };
}
