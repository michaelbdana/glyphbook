import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { CSSProperties } from "react";
import { Trash2 } from "lucide-react";
import type { NodeViewProps } from "@tiptap/react";
import type { ImageAttrs } from "../../../shared/model/types";

function ImageBlockView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, selected } = props;
  const attrs = node.attrs as ImageAttrs;
  const width = `${attrs.width ?? 100}%`;
  const centered = attrs.align === "center" || !attrs.align;

  const alignStyle: CSSProperties = centered
    ? { marginLeft: "auto", marginRight: "auto" }
    : attrs.align === "left"
      ? { float: "left", marginRight: "1em" }
      : { float: "right", marginLeft: "1em" };

  const seg = (value: string, set: (v: string) => void) => {
    const opts = ["left", "center", "right"];
    return opts.map((o) => (
      <button
        key={o}
        onClick={() => set(o)}
        className={`rounded px-2 py-0.5 text-[11px] ${
          (value ?? "center") === o
            ? "bg-accent text-white"
            : "text-muted hover:bg-chrome"
        }`}
      >
        {o}
      </button>
    ));
  };

  return (
    <NodeViewWrapper
      as="div"
      className={`my-3 ${attrs.wrap ? "overflow-hidden" : ""}`}
      data-image-block="true"
    >
      <div style={alignStyle} className={attrs.wrap ? "clear-both" : ""}>
        <img
          src={attrs.src}
          alt={attrs.alt ?? ""}
          style={{ width, display: "block" }}
          draggable
        />
      </div>
      {attrs.caption && (
        <p
          className="my-1 text-center text-xs italic text-muted"
          style={{ clear: "both" }}
        >
          {attrs.caption}
        </p>
      )}
      {selected && (
        <div className="rounded-md border border-rule bg-chrome p-2 text-sm">
          <div className="mb-2 flex items-center gap-1">
            <span className="mr-1 text-xs text-muted">Align</span>
            {seg(attrs.align ?? "center", (v) =>
              updateAttributes({ align: v }),
            )}
            <select
              value={attrs.width ?? 100}
              onChange={(e) =>
                updateAttributes({ width: Number(e.target.value) })
              }
              className="ml-auto rounded border border-rule px-1 py-0.5 text-xs"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {[25, 50, 75, 100].map((w) => (
                <option key={w} value={w}>
                  {w}%
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <label className="text-xs">
              <span className="block text-muted">Caption</span>
              <input
                value={attrs.caption ?? ""}
                onChange={(e) => updateAttributes({ caption: e.target.value })}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full rounded border border-rule px-1.5 py-0.5"
              />
            </label>
            <label className="text-xs">
              <span className="block text-muted">Alt text</span>
              <input
                value={attrs.alt ?? ""}
                onChange={(e) => updateAttributes({ alt: e.target.value })}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full rounded border border-rule px-1.5 py-0.5"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={!!attrs.wrap}
                onChange={(e) => updateAttributes({ wrap: e.target.checked })}
                onMouseDown={(e) => e.stopPropagation()}
              />
              Wrap text
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={!!attrs.separatePage}
                onChange={(e) =>
                  updateAttributes({ separatePage: e.target.checked })
                }
                onMouseDown={(e) => e.stopPropagation()}
              />
              Separate page (print)
            </label>
            <button
              onClick={deleteNode}
              onMouseDown={(e) => e.stopPropagation()}
              className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-chrome"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const ImageBlock = Node.create({
  name: "imageBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: "" },
      caption: { default: "" },
      alt: { default: "" },
      align: { default: "center" },
      width: { default: 100 },
      wrap: { default: false },
      separatePage: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: "img[data-image-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", { "data-image-block": "true", ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
});
