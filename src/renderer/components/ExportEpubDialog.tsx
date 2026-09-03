import { useState } from "react";
import { CheckCircle2, Download, Loader2, X } from "lucide-react";
import type { Book } from "../../shared/model/types";
import { EPUB_PROFILES, type EpubProfile } from "../../shared/model/epubProfiles";

type Props = {
  book: Book;
  onClose: () => void;
};

export default function ExportEpubDialog({ book, onClose }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const exportOne = async (profile: EpubProfile, quiet = false) => {
    setBusy(quiet ? "all" : profile.id);
    setMessage(null);
    try {
      await window.glyphbook.exportEpub(book, {
        profile: profile.id,
        quiet,
      });
      if (!quiet) setMessage(`${profile.label} ePub exported.`);
    } finally {
      setBusy(null);
    }
  };

  const exportAll = async () => {
    setBusy("all");
    setMessage(null);
    try {
      for (const profile of EPUB_PROFILES) {
        await window.glyphbook.exportEpub(book, {
          profile: profile.id,
          quiet: true,
        });
      }
      setMessage(
        `Exported ${EPUB_PROFILES.length} ePubs to your exports folder.`,
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[720px] flex-col rounded-lg border border-rule bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold">Export eBook</h2>
            <p className="text-sm text-muted">
              {book.title} — each store has its own EPUB requirements, so
              choose the one you are uploading to.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-chrome"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => void exportAll()}
              disabled={busy !== null}
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {busy === "all" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export All 6
            </button>
          </div>

          <div className="space-y-2">
            {EPUB_PROFILES.map((profile) => {
              const isBusy = busy === profile.id;
              return (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 rounded-md border border-rule bg-chrome/60 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {profile.label}
                      <span className="ml-2 text-xs font-normal text-muted">
                        {profile.store}
                      </span>
                    </p>
                    <p className="text-xs text-muted">{profile.notes}</p>
                  </div>
                  <button
                    onClick={() => void exportOne(profile)}
                    disabled={busy !== null}
                    className="flex shrink-0 items-center gap-1 rounded-md border border-rule bg-white px-3 py-1.5 text-xs font-medium hover:bg-chrome disabled:opacity-50"
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Export
                  </button>
                </div>
              );
            })}
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
