export const BLEED_EDGE = 0.125;
export const BLEED_EXTRA_WIDTH = BLEED_EDGE;
export const BLEED_EXTRA_HEIGHT = BLEED_EDGE * 2;

export type PixelSize = { widthPx: number; heightPx: number };

function round(value: number): number {
  return Math.round(value);
}

export function fullBleedImageSize(
  trimWidthIn: number,
  trimHeightIn: number,
  ppi: number,
): PixelSize {
  const widthIn = trimWidthIn + BLEED_EXTRA_WIDTH;
  const heightIn = trimHeightIn + BLEED_EXTRA_HEIGHT;
  return {
    widthPx: round(widthIn * ppi),
    heightPx: round(heightIn * ppi),
  };
}

export function marginImageSize(
  trimWidthIn: number,
  insideMarginIn: number,
  outsideMarginIn: number,
  ppi: number,
): { widthPx: number; widthIn: number } {
  const widthIn = Math.max(0, trimWidthIn - insideMarginIn - outsideMarginIn);
  return { widthPx: round(widthIn * ppi), widthIn };
}
