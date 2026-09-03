import { ChevronRight, Eye, Plus, Settings2 } from "lucide-react";
import { useStore } from "../state/store";
import ChapterEditor from "../editor/ChapterEditor";
import PreviewPane from "../components/PreviewPane";
import { countWords } from "../../shared/services/wordCount";
import type { ChapterSection } from "../../shared/model/types";

const SECTION_LABEL: Record<ChapterSection, string> = {
  front: "Front Matter",
  body: "Body",
  back: "Back Matter",
};

function SectionHeader({
  section,
  count,
  onAdd,
}: {
  section: ChapterSection;
  count: number;
  onAdd: () => void;
}) {
  return (
    <div className="group flex items-center px-2 pb-1 pt-4">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {SECTION_LABEL[section]}
      </span>
      <span className="ml-1 text-[11px] text-muted/60">{count}</span>
      <button
        onClick={onAdd}
        className="ml-auto rounded p-0.5 text-muted opacity-0 hover:bg-chrome-dark group-hover:opacity-100"
        title={`Add to ${SECTION_LABEL[section]}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function WritingScreen() {
  const books = useStore((s) => s.books);
  const activeBookId = useStore((s) => s.activeBookId);
  const selectedChapterId = useStore((s) => s.selectedChapterId);
  const selectChapter = useStore((s) => s.selectChapter);
  const addChapter = useStore((s) => s.addChapter);
  const updateChapter = useStore((s) => s.updateChapter);
  const previewOpen = useStore((s) => s.previewOpen);
  const togglePreview = useStore((s) => s.togglePreview);

  const book = books.find((b) => b.id === activeBookId);
  const chapter = book?.chapters.find((c) => c.id === selectedChapterId) ?? null;

  if (!book) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        No book open. Return to My Books and open one.
      </div>
    );
  }

  const sections: ChapterSection[] = ["front", "body", "back"];
  const totalWords = book.chapters.reduce((n, c) => n + countWords(c.content), 0);

  return (
    <div className="flex h-full">
      <aside className="flex w-64 shrink-0 flex-col border-r border-rule bg-chrome">
        <div className="border-b border-rule p-3">
          <div className="flex items-center gap-1">
            <p className="truncate text-sm font-semibold">{book.title}</p>
            <button
              className="ml-auto rounded p-1 text-muted hover:bg-chrome-dark"
              title="Edit book details"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
          <p className="truncate text-xs text-muted">{book.author}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {sections.map((section) => {
            const chapters = book.chapters.filter((c) => c.section === section);
            return (
              <div key={section}>
                <SectionHeader
                  section={section}
                  count={chapters.length}
                  onAdd={() => addChapter(section)}
                />
                {chapters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectChapter(c.id)}
                    className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm ${
                      c.id === chapter?.id
                        ? "bg-chrome-dark font-medium text-accent"
                        : "text-ink hover:bg-chrome-dark/60"
                    }`}
                  >
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 ${
                        c.id === chapter?.id ? "text-accent" : "text-muted/50"
                      }`}
                    />
                    <span className="truncate">{c.title}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-10 py-6">
              {chapter ? (
                <>
                  <input
                    value={chapter.title}
                    onChange={(e) =>
                      updateChapter(chapter.id, { title: e.target.value })
                    }
                    className="mb-2 w-full border-none bg-transparent text-center text-2xl font-semibold outline-none placeholder:text-muted/40"
                    placeholder="Chapter title"
                  />
                  <ChapterEditor
                    chapter={chapter}
                    onContentChange={(doc) =>
                      updateChapter(chapter.id, { content: doc })
                    }
                  />
                </>
              ) : (
                <div className="m-auto text-center text-muted">
                  Select or add a chapter to begin writing.
                </div>
              )}
            </div>
          </div>

          {previewOpen && <PreviewPane chapter={chapter} />}
        </div>

        <footer className="flex h-9 shrink-0 items-center gap-4 border-t border-rule bg-chrome px-4 text-xs text-muted">
          <span className="flex items-center gap-1 text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-600" /> Saved
          </span>
          <button
            onClick={togglePreview}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-chrome-dark"
            title="Toggle preview"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          <span className="ml-auto">Words: {totalWords}</span>
        </footer>
      </div>
    </div>
  );
}
