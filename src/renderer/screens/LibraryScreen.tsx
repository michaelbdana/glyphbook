import { useState } from "react";
import {
  Copy,
  FilePlus2,
  FolderOpen,
  MoreVertical,
  Printer,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useStore } from "../state/store";
import {
  addSampleBook,
  deleteBook,
  duplicateBook,
  importDocxBook,
  newBook,
  openBookFromDialog,
  saveBookAsExisting,
} from "../state/session";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fileLabel(filePath: string): string {
  const name = filePath.split("/").pop()?.split("\\").pop();
  return name || filePath;
}

function BookMenu({ bookId }: { bookId: string }) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded bg-white/80 p-1 text-muted hover:bg-chrome-dark"
        title="Book options"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-md border border-rule bg-white py-1 text-sm shadow-lg">
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-chrome"
              onClick={() => {
                close();
                void duplicateBook(bookId);
              }}
            >
              <Copy className="h-4 w-4" /> Duplicate…
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-chrome"
              onClick={() => {
                close();
                void saveBookAsExisting(bookId);
              }}
            >
              <Save className="h-4 w-4" /> Save a Copy As…
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-chrome"
              onClick={() => {
                close();
                void deleteBook(bookId);
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function LibraryScreen() {
  const books = useStore((s) => s.books);
  const filePaths = useStore((s) => s.filePaths);
  const setActiveBook = useStore((s) => s.setActiveBook);
  const setScreen = useStore((s) => s.setScreen);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openBook = (id: string) => {
    setActiveBook(id);
    setScreen("writing");
  };

  const runSpike = async () => {
    setBusy(true);
    try {
      await window.glyphbook.runSpike();
    } finally {
      setBusy(false);
    }
  };

  const doUpload = async () => {
    setUploading(true);
    setActionError(null);
    try {
      await importDocxBook();
    } catch (err) {
      setActionError(`Import failed: ${String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const doOpen = async () => {
    setImporting(true);
    setActionError(null);
    try {
      await openBookFromDialog();
    } catch (err) {
      setActionError(`Open failed: ${String(err)}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-8 py-8">
        <h1 className="mb-4 text-2xl font-semibold">My Books</h1>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => void newBook()}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-hover"
            title="Choose where to save a new book (⌘/Ctrl+N)"
          >
            <FilePlus2 className="h-4 w-4" /> Start a Book…
          </button>
          <button
            onClick={() => void doOpen()}
            className="flex items-center gap-2 rounded-lg border border-rule bg-white px-4 py-2 text-sm font-medium hover:bg-chrome disabled:opacity-50"
            title="Open a saved .glyphbook book file (⌘/Ctrl+O)"
          >
            <FolderOpen className="h-4 w-4" /> {importing ? "Opening…" : "Open a Book…"}
          </button>
          <button
            onClick={() => void doUpload()}
            disabled={uploading}
            title="Import a Microsoft Word .docx manuscript"
            className="flex items-center gap-2 rounded-lg border border-rule bg-white px-4 py-2 text-sm font-medium hover:bg-chrome disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />{" "}
            {uploading ? "Importing…" : "Upload a Word Doc…"}
          </button>
          <button
            onClick={() => void addSampleBook()}
            className="flex items-center gap-2 rounded-lg border border-rule bg-white px-4 py-2 text-sm font-medium hover:bg-chrome"
          >
            <FilePlus2 className="h-4 w-4" /> Load Sample
          </button>
          <button
            onClick={() => void runSpike()}
            disabled={busy}
            className="ml-auto flex items-center gap-2 rounded-lg border border-rule bg-white px-4 py-2 text-sm font-medium hover:bg-chrome disabled:opacity-50"
            title="Dev tool: runs the paged.js print pipeline and writes a sample PDF"
          >
            <Printer className="h-4 w-4" /> {busy ? "Printing…" : "Print Spike"}
          </button>
        </div>

        {books.length === 0 ? (
          <div className="rounded-lg border border-dashed border-rule p-12 text-center">
            <h2 className="mb-2 text-lg font-semibold">Welcome to Glyphbook</h2>
            <p className="mx-auto max-w-md text-sm text-muted">
              Your offline book-writing workspace. Start a new book and choose where to
              save it, open an existing Glyphbook book file, or load the sample to
              explore.
            </p>
            {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {books.map((book) => {
              const filePath = filePaths[book.id];
              return (
                <div
                  key={book.id}
                  onClick={() => openBook(book.id)}
                  className="group cursor-pointer rounded-lg border border-rule bg-white p-3 shadow-sm transition hover:shadow-md"
                >
                  <div className="relative mb-3 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-chrome to-chrome-dark">
                    {book.cover?.src ? (
                      <img
                        src={book.cover.src}
                        alt={`${book.title} cover`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="px-2 text-center text-sm font-medium text-muted">
                        {book.title}
                      </span>
                    )}
                    <div className="absolute right-1 top-1">
                      <BookMenu bookId={book.id} />
                    </div>
                  </div>
                  <p className="truncate text-sm font-semibold">{book.title}</p>
                  <p className="truncate text-xs text-muted">
                    {book.author} · {formatDate(book.updatedAt)}
                  </p>
                  {book.version && (
                    <p className="truncate text-xs text-muted">{book.version}</p>
                  )}
                  {filePath && (
                    <p
                      className="mt-1 truncate text-[11px] text-muted/70"
                      title={filePath}
                    >
                      {fileLabel(filePath)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
