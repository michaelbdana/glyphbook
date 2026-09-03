import { useState } from "react";
import type { DragEvent } from "react";
import {
  BookMarked,
  ChevronRight,
  Eye,
  FolderOpen,
  GripVertical,
  Layers,
  Plus,
  Quote,
  Search,
  Settings2,
  SlidersHorizontal,
  Target,
  Timer,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { useStore } from "../state/store";
import { useSettingsStore } from "../state/settingsStore";
import ChapterEditor from "../editor/ChapterEditor";
import BookPreview from "../components/BookPreview";
import BookDetailsDialog from "../components/BookDetailsDialog";
import ChapterOptionsDialog from "../components/ChapterOptionsDialog";
import FullPageEditor from "../components/FullPageEditor";
import ToolsPanel from "../components/ToolsPanel";
import { countWords } from "../../shared/services/wordCount";
import { reorderInSections } from "../../shared/model/reorder";
import { presetsForSection } from "../../shared/model/presets";
import type {
  Chapter,
  ChapterSection,
  Part,
} from "../../shared/model/types";

const SECTION_LABEL: Record<ChapterSection, string> = {
  front: "Front Matter",
  body: "Body",
  back: "Back Matter",
};

type PartSlice = { part: Part; chapters: Chapter[] };

function partitionByPart(chapters: Chapter[], parts: Part[]): PartSlice[] {
  const slices: PartSlice[] = [];
  for (const part of parts) {
    const members = chapters.filter((c) => c.partId === part.id);
    if (members.length > 0) slices.push({ part, chapters: members });
  }
  return slices;
}

export default function WritingScreen() {
  const books = useStore((s) => s.books);
  const activeBookId = useStore((s) => s.activeBookId);
  const selectedChapterId = useStore((s) => s.selectedChapterId);
  const selectChapter = useStore((s) => s.selectChapter);
  const addPresetPage = useStore((s) => s.addPresetPage);
  const updateChapter = useStore((s) => s.updateChapter);
  const updateOptions = useStore((s) => s.updateOptions);
  const updateBook = useStore((s) => s.updateBook);
  const deleteChapter = useStore((s) => s.deleteChapter);
  const reorderChapters = useStore((s) => s.reorderChapters);
  const addPart = useStore((s) => s.addPart);
  const addVolume = useStore((s) => s.addVolume);
  const deletePart = useStore((s) => s.deletePart);
  const deleteVolume = useStore((s) => s.deleteVolume);
  const previewOpen = useStore((s) => s.previewOpen);
  const togglePreview = useStore((s) => s.togglePreview);
  const saveState = useStore((s) => s.saveState);
  const editorEpoch = useStore((s) => s.editorEpoch);
  const openTool = useStore((s) => s.openTool);

  const editorFont = useSettingsStore((s) => s.fontFamily);
  const editorFontSize = useSettingsStore((s) => s.fontSize);
  const editorLineHeight = useSettingsStore((s) => s.lineHeight);
  const paragraphSpacing = useSettingsStore((s) => s.paragraphSpacing);

  const [dragId, setDragId] = useState<string | null>(null);
  const [overRowId, setOverRowId] = useState<string | null>(null);
  const [overSection, setOverSection] = useState<ChapterSection | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [optionsChapterId, setOptionsChapterId] = useState<string | null>(null);
  const [addMenuSection, setAddMenuSection] = useState<ChapterSection | null>(null);
  const [groupDialog, setGroupDialog] = useState<"part" | "volume" | null>(null);
  const [groupName, setGroupName] = useState("");

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
  const volumes = book.volumes ?? [];
  const parts = book.parts ?? [];

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

  const optionsChapter = book.chapters.find((c) => c.id === optionsChapterId) ?? null;

  const renderRow = (c: Chapter, indent: string) => {
    const selected = c.id === chapter?.id;
    const over = overRowId === c.id;
    return (
      <div
        key={c.id}
        draggable
        onDragStart={(e) => startDrag(c.id, e)}
        onDragEnd={endDrag}
        onDragOver={(e) => overRow(c.id, e)}
        onDragLeave={() => setOverRowId((v) => (v === c.id ? null : v))}
        onDrop={(e) => {
          e.preventDefault();
          dropOnRow(c.id);
        }}
        onClick={() => selectChapter(c.id)}
        className={`group flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-left text-sm ${indent} ${
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
            setOptionsChapterId(c.id);
          }}
          className={`rounded p-0.5 text-muted hover:bg-chrome hover:text-accent ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          title="Chapter options"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteChapter(c.id);
          }}
          className={`rounded p-0.5 text-muted hover:bg-chrome hover:text-red-600 ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          title="Delete chapter"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const renderBodyContent = (list: Chapter[]) => {
    const partSlices = partitionByPart(list, parts);
    const partIds = new Set(partSlices.map((s) => s.part.id));
    const loose = list.filter((c) => !c.partId || !partIds.has(c.partId!));
    return (
      <>
        {partSlices.map((slice) => (
          <div key={slice.part.id}>
            <div className="group flex items-center gap-1 px-2 py-1 pl-5 text-xs font-semibold text-muted">
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="truncate">{slice.part.title}</span>
              {slice.part.subtitle && (
                <span className="truncate text-[11px] text-muted/60">
                  — {slice.part.subtitle}
                </span>
              )}
              <button
                onClick={() => {
                  if (window.confirm(`Delete part "${slice.part.title}"? Chapters will be kept.`)) {
                    deletePart(slice.part.id);
                  }
                }}
                className="ml-auto rounded p-0.5 opacity-0 hover:bg-chrome hover:text-red-600 group-hover:opacity-100"
                title="Delete part"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {slice.chapters.map((c) => renderRow(c, "pl-8"))}
          </div>
        ))}
        {loose.map((c) => renderRow(c, "pl-5"))}
      </>
    );
  };

  const renderBody = () => {
    const body = book.chapters.filter((c) => c.section === "body");
    if (volumes.length === 0) {
      return renderBodyContent(body);
    }
    const assigned = new Set<string>();
    const blocks = volumes.map((volume) => {
      const members = body.filter((c) => c.volumeId === volume.id);
      members.forEach((c) => assigned.add(c.id));
      return { volume, members };
    });
    const unassigned = body.filter((c) => !assigned.has(c.id));
    return (
      <>
        {blocks.map(({ volume, members }) => (
          <div key={volume.id}>
            <div className="group flex items-center gap-1 px-2 py-1 pl-3 text-xs font-semibold text-muted">
              <BookMarked className="h-3.5 w-3.5" />
              <span className="truncate">{volume.title}</span>
              {volume.subtitle && (
                <span className="truncate text-[11px] text-muted/60">
                  — {volume.subtitle}
                </span>
              )}
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete volume "${volume.title}"? Its chapters will be kept.`,
                    )
                  ) {
                    deleteVolume(volume.id);
                  }
                }}
                className="ml-auto rounded p-0.5 opacity-0 hover:bg-chrome hover:text-red-600 group-hover:opacity-100"
                title="Delete volume"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {renderBodyContent(members)}
          </div>
        ))}
        {renderBodyContent(unassigned)}
      </>
    );
  };

  const sectionHeader = (section: ChapterSection) => {
    const chapters = book.chapters.filter((c) => c.section === section);
    const presets = presetsForSection(section);
    return (
      <div className="relative">
        <div
          onDragOver={(e) => overSectionZone(section, e)}
          onDrop={(e) => {
            e.preventDefault();
            dropOnSection(section);
          }}
          className={`group flex items-center rounded px-2 pb-1 pt-4 ${
            overSection === section && dragId ? "ring-1 ring-accent" : ""
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {SECTION_LABEL[section]}
          </span>
          <span className="ml-1 text-[11px] text-muted/60">
            {chapters.length}
          </span>
          {section === "body" && (
            <>
              <button
                onClick={() => {
                  setGroupName("");
                  setGroupDialog("volume");
                }}
                className="ml-auto rounded p-0.5 text-muted opacity-0 hover:bg-chrome-dark group-hover:opacity-100"
                title="Add a volume"
              >
                <BookMarked className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setGroupName("");
                  setGroupDialog("part");
                }}
                className="rounded p-0.5 text-muted opacity-0 hover:bg-chrome-dark group-hover:opacity-100"
                title="Add a part"
              >
                <Layers className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() =>
              setAddMenuSection((v) => (v === section ? null : section))
            }
            className="rounded p-0.5 text-muted opacity-0 hover:bg-chrome-dark group-hover:opacity-100"
            title={`Add to ${SECTION_LABEL[section]}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {addMenuSection === section && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setAddMenuSection(null)}
            />
            <div className="absolute left-2 right-2 z-30 rounded-md border border-rule bg-white py-1 shadow-lg">
              {presets.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    addPresetPage(p.key);
                    setAddMenuSection(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-chrome"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
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
          {sections.map((section) => (
            <div key={section}>
              {sectionHeader(section)}
              {section === "front" &&
                book.chapters
                  .filter((c) => c.section === "front")
                  .map((c) => renderRow(c, ""))}
              {section === "body" && renderBody()}
              {section === "back" &&
                book.chapters
                  .filter((c) => c.section === "back")
                  .map((c) => renderRow(c, ""))}
              <div
                onDragOver={(e) => overSectionZone(section, e)}
                onDrop={(e) => {
                  e.preventDefault();
                  dropOnSection(section);
                }}
                className={`h-6 ${
                  overSection === section && dragId ? "rounded ring-1 ring-accent" : ""
                }`}
              />
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-10 py-6">
              {chapter ? (
                chapter.kind === "fullpage" ? (
                  <FullPageEditor
                    chapter={chapter}
                    onUpdate={(image) =>
                      updateChapter(chapter.id, { image })
                    }
                  />
                ) : (
                <>
                  <input
                    value={chapter.title}
                    onChange={(e) =>
                      updateChapter(chapter.id, { title: e.target.value })
                    }
                    className="mb-2 w-full border-none bg-transparent text-center text-2xl font-semibold outline-none placeholder:text-muted/40"
                    placeholder="Chapter title"
                  />
                  <div
                    key={`${chapter.id}:${editorEpoch}`}
                    className={`flex-1 ${
                      paragraphSpacing === "spaced" ? "gb-spaced" : "gb-indent"
                    }`}
                    style={{
                      fontFamily: editorFont,
                      fontSize: editorFontSize,
                      lineHeight: editorLineHeight,
                    }}
                  >
                    <ChapterEditor
                      chapter={chapter}
                      onContentChange={(doc) =>
                        updateChapter(chapter.id, { content: doc })
                      }
                    />
                  </div>
                </>
                )
              ) : (
                <div className="m-auto text-center text-muted">
                  Select or add a chapter to begin writing.
                </div>
              )}
            </div>
          </div>

          {previewOpen && <BookPreview book={book} chapter={chapter} />}
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
          <span className="mx-1 h-4 w-px bg-rule" />
          <button
            onClick={() => openTool("find")}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-chrome-dark"
            title="Find and Replace"
          >
            <Search className="h-3.5 w-3.5" /> Find
          </button>
          <button
            onClick={() => openTool("goals")}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-chrome-dark"
            title="Goals and writing habit"
          >
            <Target className="h-3.5 w-3.5" /> Goals
          </button>
          <button
            onClick={() => openTool("sprint")}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-chrome-dark"
            title="Sprint timer"
          >
            <Timer className="h-3.5 w-3.5" /> Sprint
          </button>
          <button
            onClick={() => openTool("quotes")}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-chrome-dark"
            title="Smart quotes"
          >
            <Quote className="h-3.5 w-3.5" /> Quotes
          </button>
          <button
            onClick={() => openTool("editor")}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-chrome-dark"
            title="Editor settings"
          >
            <Type className="h-3.5 w-3.5" /> Editor
          </button>
          <span className="mx-1 h-4 w-px bg-rule" />
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

      {optionsChapter && (
        <ChapterOptionsDialog
          book={book}
          chapter={optionsChapter}
          onSave={(patch) => {
            updateOptions(optionsChapter.id, patch.options ?? {});
            updateChapter(optionsChapter.id, {
              partId: patch.partId,
              volumeId: patch.volumeId,
            });
          }}
          onClose={() => setOptionsChapterId(null)}
        />
      )}

      {groupDialog && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
          onClick={() => setGroupDialog(null)}
        >
          <div
            className="w-80 rounded-lg border border-rule bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 text-lg font-semibold">
              New {groupDialog === "part" ? "Part" : "Volume"}
            </h2>
            <label className="mb-4 block text-sm">
              <span className="mb-1 block font-medium">Title</span>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
                placeholder={
                  groupDialog === "part" ? "Part title" : "Volume title"
                }
                className="w-full rounded-md border border-rule px-3 py-1.5 outline-none focus:border-accent"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setGroupDialog(null)}
                className="rounded-md border border-rule px-4 py-1.5 text-sm font-medium hover:bg-chrome"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = groupName.trim();
                  if (name) {
                    if (groupDialog === "part") addPart(name);
                    else addVolume(name);
                  }
                  setGroupDialog(null);
                }}
                className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <ToolsPanel />
    </div>
  );
}
