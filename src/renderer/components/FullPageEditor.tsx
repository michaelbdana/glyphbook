import { ImagePlus, Trash2 } from "lucide-react";
import type { Chapter, ImageAttrs } from "../../shared/model/types";

type Props = {
  chapter: Chapter;
  onUpdate: (image?: ImageAttrs) => void;
};

export default function FullPageEditor({ chapter, onUpdate }: Props) {
  const image = chapter.image;

  const pick = async () => {
    const result = await window.glyphbook.pickImage();
    if (result.ok) {
      onUpdate({ src: result.dataUrl, alt: result.name, align: "center" });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {image ? (
        <>
          <div className="max-h-[60vh] overflow-hidden rounded-md border border-rule shadow-md">
            <img
              src={image.src}
              alt={image.alt ?? ""}
              className="block max-w-full"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Alt text</span>
            <input
              value={image.alt ?? ""}
              onChange={(e) => onUpdate({ ...image, alt: e.target.value })}
              className="w-72 rounded-md border border-rule px-2 py-1 outline-none focus:border-accent"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => void pick()}
              className="rounded-md border border-rule px-3 py-1.5 text-sm font-medium hover:bg-chrome"
            >
              Replace image
            </button>
            <button
              onClick={() => onUpdate(undefined)}
              className="flex items-center gap-1 rounded-md border border-rule px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-chrome"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => void pick()}
          className="flex w-72 flex-col items-center gap-2 rounded-lg border border-dashed border-rule p-8 text-muted hover:border-accent hover:text-accent"
        >
          <ImagePlus className="h-8 w-8" />
          <span className="text-sm font-medium">
            Choose a full-page image
          </span>
          <span className="text-xs">
            JPG or PNG — sized to your trim + bleed
          </span>
        </button>
      )}
    </div>
  );
}
