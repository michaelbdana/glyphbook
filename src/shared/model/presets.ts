import type {
  Book,
  Chapter,
  ChapterKind,
  ChapterOptions,
  ChapterSection,
} from "./types";

export const DEFAULT_CHAPTER_OPTIONS: ChapterOptions = {
  includeIn: "all",
  beginOn: "auto",
  hideHeading: false,
  hidePageNumber: false,
  hideHeaderFooter: false,
  hideToc: false,
  smallerTitle: false,
  invertText: false,
};

export type Preset = {
  key: ChapterKind;
  label: string;
  section: ChapterSection;
  title: string;
  numbered: boolean;
};

export const PRESETS: Preset[] = [
  { key: "cover", label: "Cover Page", section: "front", title: "Cover", numbered: false },
  { key: "title", label: "Title Page", section: "front", title: "Title Page", numbered: false },
  { key: "copyright", label: "Copyright Page", section: "front", title: "Copyright", numbered: false },
  { key: "toc", label: "Table of Contents", section: "front", title: "Table of Contents", numbered: false },
  { key: "dedication", label: "Dedication", section: "front", title: "Dedication", numbered: false },
  { key: "epigraph", label: "Epigraph", section: "front", title: "Epigraph", numbered: false },
  { key: "blurbs", label: "Blurbs", section: "front", title: "Blurbs", numbered: false },
  { key: "foreword", label: "Foreword", section: "front", title: "Foreword", numbered: false },
  { key: "preface", label: "Preface", section: "front", title: "Preface", numbered: false },
  { key: "introduction", label: "Introduction", section: "front", title: "Introduction", numbered: false },
  { key: "prologue", label: "Prologue", section: "body", title: "Prologue", numbered: false },
  { key: "chapter", label: "Chapter", section: "body", title: "Chapter", numbered: true },
  { key: "fullpage", label: "Full Page Image", section: "body", title: "Full Page Image", numbered: false },
  { key: "epilogue", label: "Epilogue", section: "body", title: "Epilogue", numbered: false },
  { key: "afterword", label: "Afterword", section: "back", title: "Afterword", numbered: false },
  { key: "acknowledgements", label: "Acknowledgements", section: "back", title: "Acknowledgements", numbered: false },
  { key: "about", label: "About the Author", section: "back", title: "About the Author", numbered: false },
  { key: "alsoby", label: "Also By", section: "back", title: "Also By", numbered: false },
];

export function presetsForSection(section: ChapterSection): Preset[] {
  return PRESETS.filter((p) => p.section === section);
}

export function uniqueTitle(book: Book, base: string): string {
  const titles = new Set(book.chapters.map((c) => c.title));
  if (!titles.has(base)) return base;
  let n = 2;
  while (titles.has(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}

export function makePresetChapter(
  book: Book,
  preset: Preset,
): Chapter {
  return {
    id: newId(),
    title: uniqueTitle(book, preset.title),
    section: preset.section,
    numbered: preset.numbered,
    kind: preset.key,
    content: { type: "doc", content: [] },
  };
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
