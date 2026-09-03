import { useState } from "react";

const MIN = 120;
const MAX = 2400;

export function usePersistedWidth(
  key: string,
  fallback: number,
): readonly [number, (width: number) => void] {
  const [width, setWidthState] = useState<number>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        const value = Number(stored);
        if (Number.isFinite(value) && value >= MIN && value <= MAX) return value;
      }
    } catch {
      // ignore storage errors
    }
    return fallback;
  });

  const setWidth = (next: number) => {
    setWidthState(next);
    try {
      window.localStorage.setItem(key, String(Math.round(next)));
    } catch {
      // ignore storage errors
    }
  };

  return [width, setWidth] as const;
}
