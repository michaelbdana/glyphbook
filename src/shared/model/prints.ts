export type PrintKind = "paperback" | "hardcover" | "largePrint";
export type PrintInk = "bw" | "standardColor" | "premiumColor";
export type PrintPaper = "white" | "cream" | "groundwood";

export type BookPrint = {
  id: string;
  kind: PrintKind;
  label: string;
  trimWidthIn: number;
  trimHeightIn: number;
  bleed: boolean;
  ink: PrintInk;
  paper: PrintPaper;
  marginTopIn: number;
  marginBottomIn: number;
  marginInsideIn: number;
  marginOutsideIn: number;
  fontSizePt?: number;
  lineHeight?: number;
  justify?: boolean;
};

export type TrimOption = { label: string; widthIn: number; heightIn: number };

const PAPERBACK_TRIMS: TrimOption[] = [
  { label: '5" × 8"', widthIn: 5, heightIn: 8 },
  { label: '5.06" × 7.81"', widthIn: 5.06, heightIn: 7.81 },
  { label: '5.25" × 8"', widthIn: 5.25, heightIn: 8 },
  { label: '5.5" × 8.5"', widthIn: 5.5, heightIn: 8.5 },
  { label: '6" × 9"', widthIn: 6, heightIn: 9 },
  { label: '6.14" × 9.21"', widthIn: 6.14, heightIn: 9.21 },
  { label: '6.69" × 9.61"', widthIn: 6.69, heightIn: 9.61 },
  { label: '7" × 10"', widthIn: 7, heightIn: 10 },
  { label: '7.44" × 9.69"', widthIn: 7.44, heightIn: 9.69 },
  { label: '7.5" × 9.25"', widthIn: 7.5, heightIn: 9.25 },
  { label: '8" × 10"', widthIn: 8, heightIn: 10 },
  { label: '8.5" × 11"', widthIn: 8.5, heightIn: 11 },
];

const HARDCOVER_TRIMS: TrimOption[] = [
  { label: '5.5" × 8.5"', widthIn: 5.5, heightIn: 8.5 },
  { label: '6" × 9"', widthIn: 6, heightIn: 9 },
  { label: '6.14" × 9.21"', widthIn: 6.14, heightIn: 9.21 },
  { label: '7" × 10"', widthIn: 7, heightIn: 10 },
  { label: '8.25" × 11"', widthIn: 8.25, heightIn: 11 },
];

export function trimOptions(kind: PrintKind): TrimOption[] {
  return kind === "hardcover" ? HARDCOVER_TRIMS : PAPERBACK_TRIMS;
}

export function trimLabel(p: Pick<BookPrint, "trimWidthIn" | "trimHeightIn">): string {
  return `${p.trimWidthIn}" × ${p.trimHeightIn}"`;
}

const KINDS: Record<PrintKind, { label: string; plural: string }> = {
  paperback: { label: "Paperback", plural: "Paperback" },
  hardcover: { label: "Hardcover", plural: "Hardcover" },
  largePrint: { label: "Large Print", plural: "Large Print" },
};

export function printKindLabel(kind: PrintKind): string {
  return KINDS[kind].label;
}

export function newPrintId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function defaultPrint(kind: PrintKind, index: number): BookPrint {
  const id = newPrintId();
  if (kind === "hardcover") {
    return {
      id,
      kind,
      label: `Hardcover`,
      trimWidthIn: 6,
      trimHeightIn: 9,
      bleed: false,
      ink: "bw",
      paper: "white",
      marginTopIn: 0.8,
      marginBottomIn: 0.8,
      marginInsideIn: 0.9,
      marginOutsideIn: 0.75,
      fontSizePt: 12,
      lineHeight: 1.5,
    };
  }
  if (kind === "largePrint") {
    return {
      id,
      kind,
      label: "Large Print",
      trimWidthIn: 6.14,
      trimHeightIn: 9.21,
      bleed: false,
      ink: "bw",
      paper: "white",
      marginTopIn: 0.85,
      marginBottomIn: 0.9,
      marginInsideIn: 0.9,
      marginOutsideIn: 0.85,
      fontSizePt: 16,
      lineHeight: 1.6,
      justify: false,
    };
  }
  void index;
  return {
    id,
    kind,
    label: "Paperback",
    trimWidthIn: 6,
    trimHeightIn: 9,
    bleed: false,
    ink: "bw",
    paper: "cream",
    marginTopIn: 0.75,
    marginBottomIn: 0.8,
    marginInsideIn: 0.8,
    marginOutsideIn: 0.75,
  };
}

export const DEFAULT_PRINT_KINDS: PrintKind[] = [
  "paperback",
  "hardcover",
  "largePrint",
];

export function defaultPrints(): BookPrint[] {
  return DEFAULT_PRINT_KINDS.map((kind, i) => defaultPrint(kind, i));
}

export function applyPrintToTheme<T extends {
  trimWidthIn: number;
  trimHeightIn: number;
  marginTopIn: number;
  marginBottomIn: number;
  marginInsideIn: number;
  marginOutsideIn: number;
  bodyFontSizePt: number;
  lineHeight: number;
  justify: boolean;
}>(base: T, print: BookPrint): T {
  return {
    ...base,
    trimWidthIn: print.trimWidthIn,
    trimHeightIn: print.trimHeightIn,
    marginTopIn: print.marginTopIn,
    marginBottomIn: print.marginBottomIn,
    marginInsideIn: print.marginInsideIn,
    marginOutsideIn: print.marginOutsideIn,
    bodyFontSizePt: print.fontSizePt ?? base.bodyFontSizePt,
    lineHeight: print.lineHeight ?? base.lineHeight,
    justify: print.justify ?? base.justify,
  };
}
