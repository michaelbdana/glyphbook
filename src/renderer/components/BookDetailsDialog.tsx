import { useState } from "react";
import type { Book } from "../../shared/model/types";

type Props = {
  book: Book;
  onSave: (patch: {
    title: string;
    author: string;
    projectName?: string;
    version?: string;
  }) => void;
  onClose: () => void;
};

export default function BookDetailsDialog({ book, onSave, onClose }: Props) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [projectName, setProjectName] = useState(book.projectName ?? "");
  const [version, setVersion] = useState(book.version ?? "");

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-96 rounded-lg border border-rule bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">Book Details</h2>

        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full rounded-md border border-rule px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>

        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium">Author / Pen Name</span>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-md border border-rule px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>

        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium">Project Name</span>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Optional — e.g., series or project"
            className="w-full rounded-md border border-rule px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>

        <label className="mb-5 block text-sm">
          <span className="mb-1 block font-medium">Version</span>
          <input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g., Draft 1"
            className="w-full rounded-md border border-rule px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-rule px-4 py-1.5 text-sm font-medium hover:bg-chrome"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({
                title,
                author,
                projectName: projectName.trim() || undefined,
                version: version.trim() || undefined,
              });
              onClose();
            }}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
