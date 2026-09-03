import { useState } from "react";
import type { DragEvent } from "react";
import {
  ChevronRight,
  Eye,
  GripVertical,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { useStore } from "../state/store";
import ChapterEditor from "../editor/ChapterEditor";
import PreviewPane from "../components/PreviewPane";
import BookDetailsDialog from "../components/BookDetailsDialog";
import { countWords } from "../../shared/services/wordCount";
import { reorderInSections } from "../../shared/model/reorder";
import type { ChapterSection } from "../../shared/model/types";

const SECTION_LABEL: Record<ChapterSection, string> = {
  front: "Front Matter",
  body: "Body",
  back: "Back Matter",
};

export default function WritingScreen() {
  const books = useStore((s) => s.books);
  const activeBookId = useStore((s) => s.activeBookId);
  const selectedChapterId = useStore((s) => s.selectedChapterId);
  const selectChapter = useStore((s) => s.selectChapter);
  const addChapter = useStore((s) => s.addChapter);
  const updateChapter = useStore((s) => s.updateChapter);
  const updateBook = useStore((s) => s.updateBook);
  const deleteChapter = useStore((s) => s.deleteChapter);
  const reorderChapters = useStore((s) => s.reorderChapters);
  const previewOpen = useStore((s) => s.previewOpen);
  const togglePreview = useStore((s) => s.togglePreview);
  const saveState = useStore((s) => s.saveState);

  const [dragId, setDragId] = useState<string | null>(null);
  const [overRowId, setOverRowId] = useState<string | null>(null);
  const [overSection, setOverSection] = useState<ChapterSection | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
  const totalWords = book.chapters.reduce(
    (n, c) => n + countWords(c.content),
    0,
  );

  const dropOnRow = (targetId: string) => {
    if (!dragId) return;
    reorderChapters(
      reorderInSections(book.chapters, dragId, {
        kind: "before",
        targetId,
      }),
    );
    endDrag();
  };

  const dropOnSection = (section: ChapterSection) => {
    if (!dragId) return;
    reorderChapters(
      reorderInSections(book.chapters, dragId, {
        kind: "endOfSection",
        section,
      }),
    );
    endDrag();
  };

  const startDrag = (id: string, event: DragEvent) => {
    setDragId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const endDrag = () => {
    setDragId(null);
    setOverRowId(null);
    setOverSection(null);
  };

  const overRow = (id: string, event: DragEvent) => {
    if (!dragId || dragId === id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOverRowId(id);
  };

  const overSectionZone = (section: ChapterSection, event: DragEvent) => {
    if (!dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOverSection(section);
  };

  return (
    <div className="flex h-full">
      <aside className="flex w-64 shrink-0 flex-col border-r border-rule bg-chrome">
        <div className="border-b border-rule p-3">
          <div className="flex items-center gap-1">
            <p className="truncate text-sm font-semibold">{book.title}</p>
            <button
              onClick={() => setDetailsOpen(true)}
              className="ml-auto rounded p-1 text-muted hover:bg-chrome-dark"
              title="Edit book details"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
          <p className="truncate text-xs text-muted">
            {book.author}
            {book.projectName ? ` · ${book.projectName}` : ""}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {sections.map((section) => {
            const chapters = book.chapters.filter((c) => c.section === section);
            return (
              <div key={section}>
                <div
                  onDragOver={(e) => overSectionZone(section, e)}
                  onDrop={(e) => {
                    e.preventDefault();
                    dropOnSection(section);
                  }}
                  className={`group flex items-center rounded px-2 pb-1 pt-4 ${
                    overSection === section && dragId
                      ? "ring-1 ring-accent"
                      : ""
                  }`}
                  title={
                    dragId
                      ? `Move to end of ${SECTION_LABEL[section]}`
                      : undefined
                  }
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {SECTION_LABEL[section]}
                  </span>
                  <span className="ml-1 text-[11px] text-muted/60">
                    {chapters.length}
                  </span>
                  <button
                    onClick={() => addChapter(section)}
                    className="ml-auto rounded p-0.5 text-muted opacity-0 hover:bg-chrome-dark group-hover:opacity-100"
                    title={`Add to ${SECTION_LABEL[section]}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {chapters.map((c) => {
                  const selected = c.id === chapter?.id;
                  const over = overRowId === c.id;
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => startDrag(c.id, e)}
                      onDragEnd={endDrag}
                      onDragOver={(e) => overRow(c.id, e)}
                      onDragLeave={() =>
                        setOverRowId((v) => (v === c.id ? null : v))
                      }
                      onDrop={(e) => {
                        e.preventDefault();
                        dropOnRow(c.id);
                      }}
                      onClick={() => selectChapter(c.id)}
                      className={`group flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-left text-sm ${
                        selected
                          ? "bg-chrome-dark font-medium text-accent"
                          : "text-ink hover:bg-chrome-dark/60"
                      } ${over ? "ring-1 ring-accent" : ""}`}
                      title={dragId ? "Drop to insert chapter above" : undefined}
                    >
                      <GripVertical
                        className={`h-3.5 w-3.5 shrink-0 text-muted/40 ${
                          dragId ? "cursor-grabbing" : "cursor-grab"
                        }`}
                      />
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 ${
                          selected ? "text-accent" : "text-muted/50"
                        }`}
                      />
                      <span className="min-w-0 flex-1 truncate">{c.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChapter(c.id);
                        }}
                        className={`rounded p-0.5 text-muted hover:bg-chrome hover:text-red-600 ${
                          selected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                        title="Delete chapter"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}

                <div
                  onDragOver={(e) => overSectionZone(section, e)}
                  onDrop={(e) => {
                    e.preventDefault();
                    dropOnSection(section);
                  }}
                  className={`h-6 ${
                    overSection === section && dragId
                      ? "rounded ring-1 ring-accent"
                      : ""
                  }`}
                  title={
                    dragId
                      ? `Move to end of ${SECTION_LABEL[section]}`
                      : undefined
                  }
                />
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
          <span
            className={`flex items-center gap-1 ${
              saveState === "saving" ? "text-amber-600" : "text-green-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                saveState === "saving"
                  ? "animate-pulse bg-amber-500"
                  : "bg-green-600"
              }`}
            />
            {saveState === "saving" ? "Saving…" : "Saved"}
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

      {detailsOpen && (
        <BookDetailsDialog
          book={book}
          onSave={(patch) => updateBook(book.id, patch)}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </div>
  );
}
