import type { Content } from "@tiptap/core";
import type { ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Asterisk, Bold, Heading2, Italic, Pilcrow } from "lucide-react";
import type { Chapter, ProseDoc } from "../../shared/model/types";
import { SceneBreak } from "./extensions/sceneBreak";
import { Monospace, SansSerif, SmallCaps } from "./extensions/marks";
import "./extensions/extensions.css";

type Props = {
  chapter: Chapter;
  onContentChange: (doc: ProseDoc) => void;
};

type ToolButton = {
  key: string;
  active: boolean;
  title: string;
  run: () => void;
  content: ReactNode;
};

function Button({ tool }: { tool: ToolButton }) {
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

export default function ChapterEditor({
  chapter,
  onContentChange,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5, 6] },
      }),
      SceneBreak,
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

  const tools: ToolButton[] = [
    {
      key: "bold",
      active: editor.isActive("bold"),
      title: "Bold",
      run: () => editor.chain().focus().toggleBold().run(),
      content: <Bold className="h-4 w-4" />,
    },
    {
      key: "italic",
      active: editor.isActive("italic"),
      title: "Italic",
      run: () => editor.chain().focus().toggleItalic().run(),
      content: <Italic className="h-4 w-4" />,
    },
    {
      key: "paragraph",
      active: editor.isActive("paragraph"),
      title: "Paragraph",
      run: () => editor.chain().focus().setParagraph().run(),
      content: <Pilcrow className="h-4 w-4" />,
    },
    {
      key: "h2",
      active: editor.isActive("heading", { level: 2 }),
      title: "Subheading (H2)",
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      content: <Heading2 className="h-4 w-4" />,
    },
    {
      key: "sceneBreak",
      active: false,
      title: "Scene break",
      run: () => editor.chain().focus().insertContent({ type: "sceneBreak" }).run(),
      content: <Asterisk className="h-4 w-4" />,
    },
    {
      key: "smallCaps",
      active: editor.isActive("smallCaps"),
      title: "Small caps",
      run: () => editor.chain().focus().toggleMark("smallCaps").run(),
      content: <span className="text-[11px] font-semibold">Aa</span>,
    },
    {
      key: "mono",
      active: editor.isActive("monospace"),
      title: "Monospace",
      run: () => editor.chain().focus().toggleMark("monospace").run(),
      content: <span className="text-xs">M</span>,
    },
    {
      key: "sans",
      active: editor.isActive("sansSerif"),
      title: "Sans-serif",
      run: () => editor.chain().focus().toggleMark("sansSerif").run(),
      content: <span className="text-xs">S</span>,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-rule pb-2">
        {tools.map((tool, i) => (
          <span key={tool.key} className="flex items-center gap-1">
            {i > 0 && (tool.key === "h2" || tool.key === "sceneBreak") && (
              <span className="mx-1 h-5 w-px bg-rule" />
            )}
            <Button tool={tool} />
          </span>
        ))}
      </div>
      <div className="min-h-[60vh]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
