export type ParagraphSignal = {
  text: string;
  styleLevel: number;
  pageBreakBefore: boolean;
  centered: boolean;
  isFirstParagraph: boolean;
};

export type BoundaryKind =
  | "chapter"
  | "prologue"
  | "epilogue"
  | "front"
  | "back"
  | null;

const CHAPTER_RE =
  /^(chapter|chapters?\.?)\s+(\d+|[a-z]+)$/i;
const FRONT_WORDS = new Set([
  "introduction",
  "foreword",
  "preface",
]);
const BACK_WORDS = new Set([
  "afterword",
  "acknowledgements",
  "acknowledgments",
  "about the author",
  "also by",
  "author's note",
  "author’s note",
  "thanks",
]);
const NUMBER_WORDS = [
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty",
];

export function cleanTitle(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isDivisionLabel(text: string, firstWord: string): boolean {
  if (firstWord === "interlude") return true;
  if (firstWord !== "part" && firstWord !== "volume" && firstWord !== "book") {
    return false;
  }
  const rest = text.slice(firstWord.length).trim().toLowerCase();
  if (!rest) return false;
  if (/^\d+$/.test(rest)) return true;
  if (/^[ivxlcdm]+$/.test(rest) && rest.length <= 4) return true;
  return NUMBER_WORDS.includes(rest);
}

export function boundaryKind(text: string): BoundaryKind {
  const clean = cleanTitle(text);
  const firstWord = clean.split(/\s+/)[0]?.replace(/[^a-z'’]/gi, "").toLowerCase() ?? "";
  if (firstWord === "chapter") return "chapter";
  if (firstWord === "prologue" || FRONT_WORDS.has(firstWord)) return "prologue";
  if (firstWord === "epilogue") return "epilogue";
  if (BACK_WORDS.has(clean.toLowerCase())) return "back";
  if (isDivisionLabel(clean, firstWord)) return "chapter";
  return null;
}

export function looksLikeTitle(text: string): boolean {
  const clean = cleanTitle(text);
  if (!clean) return false;
  if (CHAPTER_RE.test(clean)) return true;
  if (clean.length > 90) return false;
  return !/[.!?…]$/.test(clean);
}

export function isLikelyBoundary(p: ParagraphSignal): BoundaryKind | null {
  const marker = boundaryKind(p.text);
  if (marker) return marker;

  if (p.isFirstParagraph) return null;
  if (p.styleLevel <= 0 || p.styleLevel > 3) return null;

  const short = looksLikeTitle(p.text);
  if (!short) return null;

  let score = 0;
  score += p.styleLevel === 1 ? 3 : p.styleLevel === 2 ? 2 : 1;
  if (p.pageBreakBefore) score += 2;
  if (p.centered) score += 1;
  return score >= 3 ? "chapter" : null;
}
