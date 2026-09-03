export type ParagraphStart = "indent" | "spaced";
export type FirstParagraph = "none" | "dropCap" | "leadIn" | "both";
export type LayoutPriority = "widowOrphans" | "balanced" | "bestOfBoth";
export type NotesPlacement = "foot" | "endChapter" | "endBook";
export type PageNumberLocation = "header" | "footer" | "none";
export type RunningHeader = "none" | "bookTitle" | "chapterTitle";
export type TextAlign = "left" | "center" | "justify";

export type BookTheme = {
  bodyFontFamily: string;
  bodyFontSizePt: number;
  lineHeight: number;
  paragraphStart: ParagraphStart;
  justify: boolean;
  firstParagraph: FirstParagraph;
  headingFontFamily: string;
  headingFontSizePt: number;
  headingAlign: TextAlign;
  sceneBreakOrnament: string;
  notesPrint: NotesPlacement;
  notesEbook: NotesPlacement;
  trimWidthIn: number;
  trimHeightIn: number;
  marginTopIn: number;
  marginBottomIn: number;
  marginInsideIn: number;
  marginOutsideIn: number;
  layoutPriority: LayoutPriority;
  pageNumber: PageNumberLocation;
  runningHeader: RunningHeader;
  largePrint: boolean;
};

export type BookThemeOverride = Partial<BookTheme>;

export const FONT_FAMILIES: { id: string; label: string; css: string }[] = [
  {
    id: "serif",
    label: "Classic Serif",
    css: 'Georgia, "Liberation Serif", "Noto Serif", serif',
  },
  {
    id: "humanist-serif",
    label: "Book Serif",
    css: 'Garamond, "EB Garamond", "Liberation Serif", serif',
  },
  {
    id: "sans",
    label: "Humanist Sans",
    css: '"Segoe UI", "Helvetica Neue", "Noto Sans", "Liberation Sans", sans-serif',
  },
  {
    id: "condensed",
    label: "Modern Sans",
    css: '"Arial Narrow", "Liberation Sans Narrow", "DejaVu Sans Condensed", sans-serif',
  },
];

export const HEADING_FAMILIES: { id: string; label: string; css: string }[] = [
  ...FONT_FAMILIES,
  {
    id: "allcaps",
    label: "All-Caps Serif",
    css: 'Georgia, "Liberation Serif", serif',
  },
  {
    id: "small",
    label: "Small Serif",
    css: 'Georgia, "Liberation Serif", serif',
  },
];

export const TRIM_SIZES: {
  label: string;
  widthIn: number;
  heightIn: number;
}[] = [
  { label: '5" × 8"', widthIn: 5, heightIn: 8 },
  { label: '5.25" × 8"', widthIn: 5.25, heightIn: 8 },
  { label: '5.5" × 8.5"', widthIn: 5.5, heightIn: 8.5 },
  { label: '6" × 9"', widthIn: 6, heightIn: 9 },
  { label: '6.14" × 9.21"', widthIn: 6.14, heightIn: 9.21 },
  { label: '7" × 10"', widthIn: 7, heightIn: 10 },
  { label: '8.5" × 11"', widthIn: 8.5, heightIn: 11 },
];

export const DEFAULT_THEME: BookTheme = {
  bodyFontFamily: FONT_FAMILIES[0].css,
  bodyFontSizePt: 11.5,
  lineHeight: 1.45,
  paragraphStart: "indent",
  justify: true,
  firstParagraph: "none",
  headingFontFamily: FONT_FAMILIES[0].css,
  headingFontSizePt: 18,
  headingAlign: "left",
  sceneBreakOrnament: "* * *",
  notesPrint: "foot",
  notesEbook: "endChapter",
  trimWidthIn: 6,
  trimHeightIn: 9,
  marginTopIn: 0.7,
  marginBottomIn: 0.8,
  marginInsideIn: 0.85,
  marginOutsideIn: 0.8,
  layoutPriority: "bestOfBoth",
  pageNumber: "footer",
  runningHeader: "chapterTitle",
  largePrint: false,
};

export type ThemePreset = { id: string; name: string; theme: BookTheme };

function variant(overrides: Partial<BookTheme>): BookTheme {
  return { ...DEFAULT_THEME, ...overrides };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "finch",
    name: "Finch",
    theme: variant({
      bodyFontFamily: FONT_FAMILIES[0].css,
      headingFontFamily: HEADING_FAMILIES[0].css,
      headingAlign: "center",
      firstParagraph: "dropCap",
    }),
  },
  {
    id: "minerva",
    name: "Minerva",
    theme: variant({
      headingFontFamily: FONT_FAMILIES[0].css,
      headingFontSizePt: 16,
      headingAlign: "center",
      sceneBreakOrnament: "❦",
    }),
  },
  {
    id: "clairmont",
    name: "Clairmont",
    theme: variant({
      bodyFontFamily: FONT_FAMILIES[1].css,
      headingFontFamily: FONT_FAMILIES[1].css,
      headingAlign: "center",
      bodyFontSizePt: 12,
    }),
  },
  {
    id: "intratech",
    name: "Intratech",
    theme: variant({
      bodyFontFamily: FONT_FAMILIES[2].css,
      headingFontFamily: FONT_FAMILIES[2].css,
      paragraphStart: "spaced",
      justify: false,
    }),
  },
  {
    id: "paperback",
    name: "Paperback",
    theme: variant({
      headingFontFamily: FONT_FAMILIES[0].css,
      firstParagraph: "both",
      layoutPriority: "widowOrphans",
    }),
  },
  {
    id: "modernist",
    name: "Modernist",
    theme: variant({
      bodyFontFamily: FONT_FAMILIES[3].css,
      headingFontFamily: FONT_FAMILIES[3].css,
      headingAlign: "left",
      paragraphStart: "spaced",
      justify: false,
      sceneBreakOrnament: "",
    }),
  },
];

export function getPresetTheme(id: string | undefined): BookTheme {
  const preset = THEME_PRESETS.find((p) => p.id === id);
  return preset ? { ...preset.theme } : { ...DEFAULT_THEME };
}

export function mergeTheme(
  presetId: string | undefined,
  overrides: BookThemeOverride | undefined,
): BookTheme {
  return { ...getPresetTheme(presetId), ...(overrides ?? {}) };
}

export function trimLabel(theme: BookTheme): string {
  return `${theme.trimWidthIn}" × ${theme.trimHeightIn}"`;
}
