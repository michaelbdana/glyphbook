import { useRef } from "react";

type Props = {
  width: number;
  min: number;
  max: number;
  onResize: (width: number) => void;
  anchor?: "left" | "right";
};

export default function ResizeHandle({
  width,
  min,
  max,
  onResize,
  anchor = "left",
}: Props) {
  const start = useRef<{ x: number; w: number } | null>(null);

  const clamp = (value: number) => Math.min(max, Math.max(min, value));

  const nextWidth = (clientX: number): number => {
    if (!start.current) return width;
    const delta = clientX - start.current.x;
    const adjusted = anchor === "right" ? -delta : delta;
    return clamp(start.current.w + adjusted);
  };

  return (
    <div
      className="relative z-10 w-1.5 shrink-0 cursor-col-resize select-none bg-transparent transition-colors hover:bg-accent/25 active:bg-accent/40"
      style={{ touchAction: "none" }}
      title="Drag to resize"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        start.current = { x: e.clientX, w: width };
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        onResize(nextWidth(e.clientX));
      }}
      onPointerUp={() => {
        start.current = null;
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-rule" />
    </div>
  );
}
