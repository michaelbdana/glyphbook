import { useState } from "react";
import { CheckCircle2, Download, Loader2, X } from "lucide-react";
import type { Book } from "../../shared/model/types";
import { printKindLabel, trimLabel, type BookPrint } from "../../shared/model/prints";

type Props = {
  book: Book;
  onClose: () => void;
};

export default function PrintExportDialog({ book, onClose }: Props) {
  const prints = book.prints ?? [];
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const exportOne = async (print: BookPrint) => {
    setBusy(print.id);
    setMessage(null);
    try {
      await window.glyphbook.exportPdf(book, print);
      setMessage(`${print.label} PDF exported.`);
    } finally {
      setBusy(null);
    }
  };

  const exportAll = async () => {
    setBusy("all");
    setMessage(null);
    try {
      for (const print of prints) {
        await window.glyphbook.exportPdf(book, print);
      }
      setMessage(`Exported ${prints.length} print PDFs to your exports folder.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="flex max-h-[85vh] w-[680px] flex-col rounded-lg border border-rule bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold">Export Print PDF</h2>
            <p className="text-sm text-muted">
              Each print version uses its own stored trim, margins, bleed, and
              typography settings.
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted hover:bg-chrome" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => void exportAll()}
              disabled={busy !== null || prints.length === 0}
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export All ({prints.length})
            </button>
          </div>

          <div className="space-y-2">
            {prints.map((print) => (
              <div key={print.id} className="flex items-center gap-3 rounded-md border border-rule bg-chrome/60 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {print.label}
                    <span className="ml-2 text-xs font-normal text-muted">
                      {printKindLabel(print.kind)}
                    </span>
                  </p>
                  <p className="text-xs text-muted">
                    {trimLabel(print)} · {print.ink === "bw" ? "B&W" : "Color"} ·{" "}
                    {print.paper} paper · {print.bleed ? "with bleed" : "no bleed"} ·{" "}
                    {print.fontSizePt ? `${print.fontSizePt}pt` : "theme size"}
                  </p>
                </div>
                <button
                  onClick={() => void exportOne(print)}
                  disabled={busy !== null}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-rule bg-white px-3 py-1.5 text-xs font-medium hover:bg-chrome disabled:opacity-50"
                >
                  {busy === print.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Export
                </button>
              </div>
            ))}
          </div>

          {message && (
            <p className="mt-3 flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" /> {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
