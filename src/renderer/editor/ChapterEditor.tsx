import type { Content } from "@tiptap/core";
import type { ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import type { Level } from "@tiptap/extension-heading";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Asterisk,
  Bold,
  Code,
  Eraser,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import type { Chapter, ProseDoc } from "../../shared/model/types";
import { SceneBreak } from "./extensions/sceneBreak";
import { Monospace, SansSerif, SmallCaps } from "./extensions/marks";
import { ImageBlock } from "./extensions/imageBlock";
import "./extensions/extensions.css";

type Props = {
  chapter: Chapter;
  onContentChange: (doc: ProseDoc) => void;
};

type Tool =
  | { kind: "sep" }
  | {
      kind: "btn";
      key: string;
      active: boolean;
      title: string;
      run: () => void;
      content: ReactNode;
    };

const HEADING_LEVELS: Level[] = [2, 3, 4, 5, 6];

function Button({ tool }: { tool: Extract<Tool, { kind: "btn" }> }) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={tool.run}
      title={tool.title}
      className={`rounded p-1.5 ${
        tool.active
          ? "bg-chrome-dark text-accent"
          : "text-muted hover:bg-chrome-dark"
      }`}
    >
      {tool.content}
    </button>
  );
}

export default function ChapterEditor({ chapter, onContentChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: HEADING_LEVELS },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      SceneBreak,
      ImageBlock,
      SmallCaps,
      Monospace,
      SansSerif,
    ],
    content: chapter.content as unknown as Content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getJSON() as unknown as ProseDoc);
    },
  });

  if (!editor) {
    return null;
  }

  const headingLevel = editor.isActive("heading")
    ? (editor.getAttributes("heading").level as number)
    : null;

  const btn = (
    key: string,
    active: boolean,
    title: string,
    run: () => void,
    content: ReactNode,
  ): Tool => ({ kind: "btn", key, active, title, run, content });

  const tools: Tool[] = [
    btn("undo", false, "Undo", () => editor.chain().focus().undo().run(), (
      <Undo2 className="h-4 w-4" />
    )),
    btn("redo", false, "Redo", () => editor.chain().focus().redo().run(), (
      <Redo2 className="h-4 w-4" />
    )),
    { kind: "sep" },
    btn(
      "bold",
      editor.isActive("bold"),
      "Bold",
      () => editor.chain().focus().toggleBold().run(),
      <Bold className="h-4 w-4" />,
    ),
    btn(
      "italic",
      editor.isActive("italic"),
      "Italic",
      () => editor.chain().focus().toggleItalic().run(),
      <Italic className="h-4 w-4" />,
    ),
    btn(
      "underline",
      editor.isActive("underline"),
      "Underline",
      () => editor.chain().focus().toggleUnderline().run(),
      <UnderlineIcon className="h-4 w-4" />,
    ),
    btn(
      "strike",
      editor.isActive("strike"),
      "Strikethrough",
      () => editor.chain().focus().toggleStrike().run(),
      <Strikethrough className="h-4 w-4" />,
    ),
    btn(
      "code",
      editor.isActive("code"),
      "Inline code",
      () => editor.chain().focus().toggleCode().run(),
      <Code className="h-4 w-4" />,
    ),
    btn("clear", false, "Clear formatting", () => {
      editor.chain().focus().unsetAllMarks().run();
    }, <Eraser className="h-4 w-4" />),
    { kind: "sep" },
    {
      kind: "btn",
      key: "heading-select",
      active: false,
      title: "",
      run: () => undefined,
      content: (
        <select
          value={headingLevel ? String(headingLevel) : "p"}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "p") editor.chain().focus().setParagraph().run();
            else
              editor
                .chain()
                .focus()
                .toggleHeading({ level: Number(value) as Level })
                .run();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded-md border border-rule bg-white px-1.5 py-1 text-xs"
        >
          <option value="p">Paragraph</option>
          {HEADING_LEVELS.map((level) => (
            <option key={level} value={level}>
              Heading {level}
            </option>
          ))}
        </select>
      ),
    },
    btn(
      "bullet",
      editor.isActive("bulletList"),
      "Bulleted list",
      () => editor.chain().focus().toggleBulletList().run(),
      <List className="h-4 w-4" />,
    ),
    btn(
      "ordered",
      editor.isActive("orderedList"),
      "Numbered list",
      () => editor.chain().focus().toggleOrderedList().run(),
      <ListOrdered className="h-4 w-4" />,
    ),
    btn(
      "blockquote",
      editor.isActive("blockquote"),
      "Block quote",
      () => editor.chain().focus().toggleBlockquote().run(),
      <Quote className="h-4 w-4" />,
    ),
    btn("hr", false, "Horizontal rule", () => {
      editor.chain().focus().setHorizontalRule().run();
    }, <Minus className="h-4 w-4" />),
    { kind: "sep" },
    btn(
      "alignLeft",
      editor.isActive({ textAlign: "left" }),
      "Align left",
      () => editor.chain().focus().setTextAlign("left").run(),
      <AlignLeft className="h-4 w-4" />,
    ),
    btn(
      "alignCenter",
      editor.isActive({ textAlign: "center" }),
      "Align center",
      () => editor.chain().focus().setTextAlign("center").run(),
      <AlignCenter className="h-4 w-4" />,
    ),
    btn(
      "alignRight",
      editor.isActive({ textAlign: "right" }),
      "Align right",
      () => editor.chain().focus().setTextAlign("right").run(),
      <AlignRight className="h-4 w-4" />,
    ),
    btn(
      "alignJustify",
      editor.isActive({ textAlign: "justify" }),
      "Justify",
      () => editor.chain().focus().setTextAlign("justify").run(),
      <AlignJustify className="h-4 w-4" />,
    ),
    { kind: "sep" },
    btn(
      "smallCaps",
      editor.isActive("smallCaps"),
      "Small caps",
      () => editor.chain().focus().toggleMark("smallCaps").run(),
      <span className="text-[11px] font-semibold">Aa</span>,
    ),
    btn(
      "mono",
      editor.isActive("monospace"),
      "Monospace",
      () => editor.chain().focus().toggleMark("monospace").run(),
      <span className="text-xs">M</span>,
    ),
    btn(
      "sans",
      editor.isActive("sansSerif"),
      "Sans-serif",
      () => editor.chain().focus().toggleMark("sansSerif").run(),
      <span className="text-xs">S</span>,
    ),
    { kind: "sep" },
    btn(
      "image",
      false,
      "Insert image",
      () => {
        void window.glyphbook.pickImage().then((result) => {
          if (!result.ok) return;
          editor
            .chain()
            .focus()
            .insertContent({
              type: "imageBlock",
              attrs: {
                src: result.dataUrl,
                alt: result.name,
                width: 100,
                align: "center",
              },
            })
            .run();
        });
      },
      <ImagePlus className="h-4 w-4" />,
    ),
    btn(
      "sceneBreak",
      false,
      "Scene break",
      () => editor.chain().focus().insertContent({ type: "sceneBreak" }).run(),
      <Asterisk className="h-4 w-4" />,
    ),
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-rule pb-2">
        {tools.map((tool, index) => {
          if (tool.kind === "sep") {
            return (
              <span key={`sep-${index}`} className="mx-1 h-5 w-px bg-rule" />
            );
          }
          return <Button key={tool.key} tool={tool} />;
        })}
      </div>
      <div className="min-h-[60vh]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
