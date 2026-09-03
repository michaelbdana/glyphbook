import type { Content } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, Pilcrow } from "lucide-react";
import type { Chapter, ProseDoc } from "../../shared/model/types";

type Props = {
  chapter: Chapter;
  onContentChange: (doc: ProseDoc) => void;
};

export default function ChapterEditor({
  chapter,
  onContentChange,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5, 6] },
      }),
    ],
    content: chapter.content as unknown as Content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getJSON() as unknown as ProseDoc);
    },
  });

  if (!editor) {
    return null;
  }

  const toolButton = (
    active: boolean,
    label: string,
    onClick: () => void,
  ) => (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      className={`rounded p-1.5 ${
        active ? "bg-chrome-dark text-accent" : "text-muted hover:bg-chrome-dark"
      }`}
    >
      {label === "Bold" ? (
        <Bold className="h-4 w-4" />
      ) : label === "Italic" ? (
        <Italic className="h-4 w-4" />
      ) : label === "Heading 2" ? (
        <Heading2 className="h-4 w-4" />
      ) : (
        <Pilcrow className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-rule pb-2">
        {toolButton(editor.isActive("bold"), "Bold", () =>
          editor.chain().focus().toggleBold().run(),
        )}
        {toolButton(editor.isActive("italic"), "Italic", () =>
          editor.chain().focus().toggleItalic().run(),
        )}
        <span className="mx-1 h-5 w-px bg-rule" />
        {toolButton(
          editor.isActive("paragraph"),
          "Paragraph",
          () => editor.chain().focus().setParagraph().run(),
        )}
        {toolButton(
          editor.isActive("heading", { level: 2 }),
          "Heading 2",
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        )}
      </div>
      <div className="min-h-[60vh]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
