# Glyphbook

An offline, desktop book-writing and book-formatting application. Write a manuscript, organize it into front matter / body / back matter with chapters, scenes, parts and volumes, apply a theme, preview it on phones, e-readers, and in print, and export **print PDFs**, **store-specific ePub files**, and **DOCX** — all from a single source file, with no login and no cloud.

- One-time local install (Windows, macOS, Linux)
- Fully offline: your books live on your computer (`library.json` + timed snapshots)
- A familiar three-screen workflow: **My Books → Writing → Formatting**
- All features below are implemented and covered by an automated test suite

## Tech stack

Electron 44 + TypeScript (strict) + React + Tailwind CSS v4 + TipTap/ProseMirror + Zustand. Print rendering uses paged.js + Chromium `printToPDF`; ePub is generated in-process (JSZip); DOCX via the `docx` package; Word (.docx) import parses the raw OOXML (paragraph styles, page breaks, run formatting) directly with JSZip — no external converters.

## Requirements

- Node.js 18+ (developed on 22) and npm
- ~700 MB free disk for the first install (Electron binary)

## Features

### Library & book management (My Books)
- Start a new book, upload an existing **.docx**, or load a sample
- Cover thumbnails on each book tile (captured automatically from imported documents)
- Book CRUD: open, duplicate, delete, rename via **Book Details** (title, author/pen name, project name, version)
- Most-recently-used ordering; grid tiles
- First-run welcome with an empty library

### Writing editor (WYSIWYG)
- Undo / redo and full rich-text formatting: bold, italic, underline, strikethrough, inline code, small caps, monospace, sans-serif, clear formatting
- Paragraph style dropdown (Paragraph / Heading 2–6)
- Text alignment: left, center, right, justify
- Bulleted and numbered lists, block quotes, horizontal rules
- Scene breaks and inline images
- Editor display preferences (font, size, line height, indented vs. spaced paragraphs, spell check) — display-only, never affects output
- Words are auto-saved to disk as you type

### Book structure
- Front Matter / Body / Back Matter sections with drag-and-drop reordering and cross-section moves
- Preset pages: **Cover**, Title Page, Copyright, Table of Contents, Dedication, Epigraph, Blurbs, Foreword, Preface, Introduction, Prologue, Chapter, Epilogue, Afterword, Acknowledgements, About the Author, Also By, Full Page Image
- Parts & Volumes grouping with keep-children delete
- Per-page **Chapter Options**: Include In (All/eBook/Print/None), Begin On, hide heading/page number/header-footer/TOC, smaller title, invert text
- **Reclassify** any item between sections and page types (e.g., fix an import that guessed a chapter where a Copyright page belongs)

### Writing tools
- Word counts (book-wide and nested-aware)
- Find & Replace across the whole book (case option, replace all)
- Smart quotes conversion (book-wide, typographic “ ” ‘ ’)
- Book Goal (target words + due date + writing days → words-per-day)
- Writing Habit tracker (daily target, auto word log, streak)
- Sprint timer

### Themes & formatting (Formatting)
- Theme-as-data model: preset themes and a custom theme builder
- Body/heading fonts, sizes, line height, justification, paragraph start, drop caps/lead-in, scene-break ornaments
- Trim sizes and margins; page-number/running-header placement (legacy theme headers)
- Print-ready CSS compiler shared by preview and export

### Print versions (paperback / hardcover / large print)
- Three stored configs per book by default: **Paperback, Hardcover, Large Print** — each fully editable and persisted with the book
- Per version: name, KDP trim-size catalogs (or custom), four margins, **bleed** (page sized to KDP spec: width +0.125″, height +0.25″), ink (B&W / standard / premium color), paper (white / cream / groundwood), body font size, line height, justification
- **Print-only headers & footers** per version: left / center / right text boxes with macros — `{page}`, `{total}`, `{book}`, `{author}`, `{chapter}` — plus bold/italic/underline; compiled into CSS paged-media margin boxes and never into the eBook

### Imaging
- Inline images with alignment, width %, caption, alt text, wrap text, separate-page (print), remove
- Full-page image pages and the optional **Cover page**
- Image Size Calculator (full-bleed and in-margin pixel math for print and eBook)

### Previews
- Device previews (Kindle Paperwhite/Oasis, Nook Glowlight, Kobo Forma, iPhone, Galaxy, iPad, Kindle Fire) rendered from the same content/theme as export
- Print preview using the compiled print CSS; resizable panes whose widths are remembered

### Import (.docx)
- Parses Word's raw XML: paragraph styles, page breaks, centering, run-level bold/italic **and** character/paragraph style chains (e.g., italics via the Emphasis style), including `w:i/w:b val=0` overrides
- Auto chapter detection: Heading 1–3 short titles, page-break-started centered titles, and markers like "Chapter One", "Prologue", "Epilogue", "Part One", plus back-matter labels — tolerant of manuscripts that use Heading 2 for chapters
- Extracts the document's cover image (first drawing) and inserts it as the first **Cover** page
- Adds Title Page / Copyright / Table of Contents front matter automatically

### Export
- **Print PDF** per stored print version (Paperback/Hardcover/Large Print), with KDP bleed geometry; filenames like `Title-Paperback.pdf`
- **ePub** with store profiles — **Kindle (KDP), Nook, Google Play, Apple Books (iBooks), Kobo, Generic** (and **Export All 6**): each tuned to that store (e.g., Kindle omits the interior cover since Amazon adds it; Kobo keeps the cover first; EPUB3 nav + NCX; embedded cover metadata)
- **DOCX** for sharing/backup
- Everything exports to your `exports/` folder with "Reveal in folder" after export

### Data safety
- Debounced autosave to `library.json` with timed snapshot backups (last 10 kept)
- Per-book `.json` snapshot export
- Local `settings.json`; zero network, no accounts, no telemetry

## Requirements note
See [Requirements](#requirements) above. Node/npm are needed only to build; end users install just the packaged app.

## Run in development

```bash
npm install
npm run dev
```

`npm run dev` compiles the Electron main process, starts the Vite dev server with hot reload, and opens the app window.

### Linux notes

- If no window appears under a Wayland session (KDE/GNOME):

  ```bash
  npm run build
  npx electron --ozone-platform-hint=auto .
  ```

- Sandbox errors (e.g. `SUID sandbox helper` on some distributions):

  ```bash
  npm run build
  npx electron --no-sandbox .
  ```

  or set `ELECTRON_DISABLE_SANDBOX=1` before `npm run dev`.
- Missing GUI libraries on minimal Fedora/Debian installs: `gtk3`, `libnss3`, `libXScrnSaver`, `libasound`.

## Run the production build

```bash
npm run build
npm start
```

## Tests, typecheck, lint

```bash
npm test          # unit tests (Vitest)
npm run typecheck # strict TypeScript checks (renderer + electron)
npm run lint      # ESLint
```

## Packaging

Installers are produced with electron-builder. Run the `dist` script for your platform **on that platform** (macOS packages must be built on macOS; Windows packages on Windows; cross-building is not configured).

The app icon is generated before packaging (the `dist:*` scripts do this automatically); to regenerate it manually: `npm run icon` (writes `build/icon.png`).

Outputs land in `release/`.

### Linux — AppImage and .deb

```bash
npm run dist:linux
# outputs release/Glyphbook-<version>.AppImage and release/Glyphbook-<version>.deb
```

Run the AppImage directly:

```bash
chmod +x release/Glyphbook-*.AppImage
./release/Glyphbook-*.AppImage
```

If an AppImage won't launch on your distro, extract and run the unpacked build instead:

```bash
npm run pack:dir
./release/linux-unpacked/glyphbook
```

### Windows — NSIS installer

```bash
npm run dist:win
# outputs release/Glyphbook Setup <version>.exe
```

Run the installer, or use the portable unpacked output via `npm run pack:dir` then launch `release/win-unpacked/Glyphbook.exe`.

### macOS — DMG

```bash
npm run dist:mac
# outputs release/Glyphbook-<version>.dmg
```

Open the DMG and drag Glyphbook into Applications. Notarization/signing are not configured yet; on first launch use right-click → Open if Gatekeeper complains about the unsigned build.

### Build all targets (runs the current platform's configs)

```bash
npm run dist
```

## Where your data lives

Glyphbook stores everything locally, no sync, no telemetry:

| Platform | Data directory |
|---|---|
| Linux | `~/.config/glyphbook/` |
| macOS | `~/Library/Application Support/glyphbook/` |
| Windows | `%APPDATA%\glyphbook\` |

Inside it: `library/library.json` (all books), `library/snapshots/` (timed autosave backups), `settings.json`, and `exports/` (PDF, ePub, DOCX). Books are also saved to your exports folder by name when you export.

## Known limitations

- Print gutter-side (recto/verso mirroring) flipping and true edge-to-edge bleed rendering for full-bleed images are approximated; page dimensions and margins follow the print specifications, but a printer-side proof pass is recommended for full-bleed image books.
- Per-box header/footer formatting (bold/italic/underline) applies to the whole margin box; paged media cannot style individual runs inside one content string.
- Chapter-running text (`{chapter}`) uses a CSS running-string; verify in the retailer's preview tool if used mid-text.
- Interior images inside a chapter are not imported from .docx (covers are); images are added in-app.
- "Scene 1..N" split navigation, boxeset compilation, and per-run print header styling are not yet built.
