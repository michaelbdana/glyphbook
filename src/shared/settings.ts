export type ParagraphSpacing = "indent" | "spaced";

export type EditorSettings = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: ParagraphSpacing;
  spellCheck: boolean;
};

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontFamily: "Georgia",
  fontSize: 16,
  lineHeight: 1.6,
  paragraphSpacing: "indent",
  spellCheck: true,
};

export function mergeSettings(value: unknown): EditorSettings {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_EDITOR_SETTINGS };
  }
  const raw = value as Record<string, unknown>;
  const fontSize =
    typeof raw.fontSize === "number" && raw.fontSize >= 12 && raw.fontSize <= 30
      ? raw.fontSize
      : DEFAULT_EDITOR_SETTINGS.fontSize;
  const lineHeight =
    typeof raw.lineHeight === "number" && raw.lineHeight >= 1 && raw.lineHeight <= 3
      ? raw.lineHeight
      : DEFAULT_EDITOR_SETTINGS.lineHeight;
  return {
    fontFamily:
      typeof raw.fontFamily === "string" && raw.fontFamily
        ? raw.fontFamily
        : DEFAULT_EDITOR_SETTINGS.fontFamily,
    fontSize,
    lineHeight,
    paragraphSpacing:
      raw.paragraphSpacing === "spaced" || raw.paragraphSpacing === "indent"
        ? raw.paragraphSpacing
        : DEFAULT_EDITOR_SETTINGS.paragraphSpacing,
    spellCheck:
      typeof raw.spellCheck === "boolean"
        ? raw.spellCheck
        : DEFAULT_EDITOR_SETTINGS.spellCheck,
  };
}
