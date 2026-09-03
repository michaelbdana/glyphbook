import { useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  fullBleedImageSize,
  marginImageSize,
} from "../../shared/services/imageCalc";

type Props = {
  trimWidthIn: number;
  trimHeightIn: number;
  insideMarginIn: number;
  outsideMarginIn: number;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-md border border-rule px-2 py-1.5 outline-none focus:border-accent";

export default function ImageCalcDialog({
  trimWidthIn,
  trimHeightIn,
  insideMarginIn,
  outsideMarginIn,
  onClose,
}: Props) {
  const [width, setWidth] = useState(String(trimWidthIn));
  const [height, setHeight] = useState(String(trimHeightIn));
  const [inside, setInside] = useState(String(insideMarginIn));
  const [outside, setOutside] = useState(String(outsideMarginIn));
  const [ppi, setPpi] = useState("300");

  const nums = useMemo(() => {
    const n = (s: string) => Number(s);
    return {
      width: n(width),
      height: n(height),
      inside: n(inside),
      outside: n(outside),
      ppi: n(ppi),
    };
  }, [width, height, inside, outside, ppi]);

  const bleed = useMemo(
    () =>
      nums.ppi > 0 && nums.width > 0 && nums.height > 0
        ? fullBleedImageSize(nums.width, nums.height, nums.ppi)
        : null,
    [nums],
  );
  const within = useMemo(
    () =>
      nums.ppi > 0 && nums.width > 0
        ? marginImageSize(nums.width, nums.inside, nums.outside, nums.ppi)
        : null,
    [nums],
  );

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    suffix: string,
  ) => (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      <div className="flex items-center gap-1">
        <input
          value={value}
          onChange={(e) => setter(e.target.value)}
          type="number"
          step="any"
          className={inputClass}
        />
        <span className="w-8 text-xs text-muted">{suffix}</span>
      </div>
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-[480px] rounded-lg border border-rule bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Image Size Calculator</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-chrome"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {field("Trim width", width, setWidth, "in")}
          {field("Trim height", height, setHeight, "in")}
          {field("PPI", ppi, setPpi, "")}
        </div>
        <div className="mb-5 grid grid-cols-2 gap-3">
          {field("Inside margin", inside, setInside, "in")}
          {field("Outside margin", outside, setOutside, "in")}
        </div>

        <div className="space-y-2 text-sm">
          <div className="rounded-md bg-chrome p-3">
            <p className="font-medium">Full-page image (bleed)</p>
            {bleed ? (
              <p className="text-muted">
                {bleed.widthPx.toLocaleString()} × {bleed.heightPx.toLocaleString()} px
                at {nums.ppi} PPI
              </p>
            ) : (
              <p className="text-muted">Enter a trim size and PPI.</p>
            )}
          </div>
          <div className="rounded-md bg-chrome p-3">
            <p className="font-medium">In-chapter image (within margins)</p>
            {within ? (
              <p className="text-muted">
                {within.widthPx.toLocaleString()} px wide ({within.widthIn.toFixed(2)} in)
              </p>
            ) : (
              <p className="text-muted">Enter a trim width.</p>
            )}
          </div>
          <p className="text-xs text-muted">
            Tip: eBook covers — Amazon KDP 2560 × 1600 px; Apple Books 2400 ×
            1600 px.
          </p>
        </div>
      </div>
    </div>
  );
}
