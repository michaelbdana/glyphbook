# Glyphbook — Application Design & Tech-Stack Document

> Working title: **Glyphbook**. Feature reference: `atticus_features.md` (compiled Atticus feature spec this app is built from).
>
> Status: Design baseline for implementation.
> Scope: Standalone desktop application. Fully offline. No login, no accounts, no cloud backend.

---

## 1. Purpose

This document defines the application stack and high-level architecture for a new, desktop-only book-writing and book-formatting application (a re-implementation of the feature set documented in `atticus_features.md`).

It is the engineering blueprint used to scaffold the project and to guide all implementation decisions. Companion design documents: `atticus_features.md` (product/feature spec) and `UI_UX.md` (interface specification — the UI is to closely mirror Atticus).

---

## 2. Product Context & Constraint Summary

| Requirement | Meaning for the stack |
|---|---|
| Standalone desktop app | No browser dependency at runtime; installed executable per OS |
| Runs on a laptop, offline | No cloud services, no login, no network calls of any kind |
| Cross-platform | Windows, macOS, Linux from one codebase |
| One-time local install | Self-contained; bundled assets/fonts; no server processes |
| No login/accounts/collaboration | Multi-user, cloud backup, sync, and roles features are OUT of scope |
| Book editing + formatting | Rich document editor (chapters, scenes, notes, callouts, images) |
| Print + eBook export | High-quality print PDF, EPUB3, and DOCX from one canonical model |

Out of scope by decision: cloud sync, online backup, user accounts, web deployment, multi-device continuity, collaboration.

---

## 3. Design Goals & Principles

1. **One canonical book model.** All three exporters (PDF / EPUB / DOCX) and the live device previews read from a single normalized, versioned "book model." Never export from editor DOM.
2. **Offline-first, data owned locally.** The project file is a plain, human-auditable format stored on the user's disk. Autosave + snapshot versions protect the user with zero infrastructure.
3. **Single codebase, consistent output.** Electron's bundled Chromium guarantees identical rendering and print output on all three OSes.
4. **Schema-driven editing.** The editor schema *is* the content spec: block types and marks are validated at the source, so malformed documents cannot reach an exporter.
5. **Deterministic, testable export.** Export pipelines are pure functions over the book model, covered by golden-file tests.
6. **Simple where possible.** No backend, no database, no auth, no analytics/telemetry.
7. **Atticus-familiar interface.** The UI intentionally mirrors Atticus's three-screen model and layout so authors already familiar with Atticus feel at home. The full UI/UX specification lives in `UI_UX.md` and is treated as a binding design input.

---

## 4. Application Stack (Summary)

| Layer | Choice |
|---|---|
| Desktop shell | **Electron** (Chromium renderer + Node.js main process) |
| Language | **TypeScript** (strict) across main/renderer/shared |
| UI framework | **React** + **Tailwind CSS** |
| Editor | **ProseMirror** via **TipTap** (headless editor wrapper) |
| App/UI state | **Zustand** |
| Local persistence | Project = single JSON "book model" file + assets folder; SQLite only if a global library/search feature is added later |
| PDF (print) export | **paged.js** (CSS Paged Media engine) rendered in a hidden Electron window → `webContents.printToPDF()` |
| EPUB export | Custom EPUB3 generator (OPF / NCX / nav.xhtml) over the book model + **JSZip** |
| DOCX export | **`docx`** (npm) generator over the book model |
| Fonts | Bundled (OFL-licensed Google Fonts subset) |
| Spell check | Electron built-in (Hunspell) spell checker, offline dictionaries |
| Image ops | Renderer **Canvas API** (resize/compress/PPI metadata); **Sharp** only if advanced need appears |
| Iconography | lucide-react |
| Packaging/distribution | **electron-builder** (NSIS / DMG / AppImage / deb) |
| Testing | **Vitest** (unit/integration), **Playwright** (E2E + export golden tests) |
| Lint/format | ESLint + Prettier |

> Version note: pin "latest stable" of every dependency at scaffold time (e.g., Electron ~current stable line, React 19, Tailwind current v4, TipTap current major). Verify compatibility matrix before locking.

---

## 5. Stack Rationale

### 5.1 Why Electron (not Tauri / native)
- **Consistent print pipeline.** The hardest deliverable is print-quality PDF pagination. Electron ships Chromium, so HTML/CSS rendering and `printToPDF` behave identically on Windows, macOS, and Linux.
- Tauri delegates rendering to each OS webview (WebView2 / WKWebView) where print-to-PDF and CSS behavior differ per platform; it also complicates the paged-media strategy. Not selected.
- Native (Qt/Swift) would sacrifice the web content stack that makes rich editing + typesetting + EPUB generation pragmatic.
- Electron trade-off (bundle size / RAM) is accepted and mitigated (see §14).

### 5.2 Why TypeScript
- One language across the main process, renderer, and export code.
- The book model and exporter contracts benefit from strict typing (discriminated unions for block/mark types).
- Type safety is the primary defense against emitting invalid EPUB/HTML/PDF structures.

### 5.3 Why ProseMirror / TipTap
- ProseMirror is schema-driven and models *document structure*, not just rich text. Our content spec is inherently structural (chapters, scenes, H2–H6, block quote, verse, callout box, text message, page break, scene break, footnotes, full-page image, tables later).
- Custom block nodes + inline marks (bold, italic, small caps, monospace, sans, sub/sup, strikethrough) map 1:1 to our content spec.
- Footnotes/endnotes implemented as inline nodes with stable IDs (required for valid EPUB navigation).
- Deterministic document serialization to the canonical model (no messy HTML round-trip).
- TipTap is used as a thin, well-supported wrapper; core logic stays framework-agnostic ProseMirror so the model layer does not leak UI concerns.

### 5.4 Why paged.js + printToPDF for print
- Chromium's native print path does **not** implement `@page` margin boxes (running headers/footers) and gives limited control over widow/orphan balancing, Begin-on-right/left auto blank pages, and per-page ornaments.
- paged.js provides CSS Paged Media support (named pages, running headers/footers, precise break control) that runs in the same Chromium renderer.
- Output strategy: paginate in a hidden window with paged.js, then capture via `webContents.printToPDF()` with Chromium's own headers/footers disabled (we render our own), producing page-accurate print PDF.
- This remains the highest-risk subsystem; dedicated spike before full build (§15).

### 5.5 Why Zustand
- Lightweight, minimal boilerplate for UI state (panels, preview device selection, goals, editor prefs).
- Editor/selection state stays inside ProseMirror; Zustand holds only app chrome. No need for Redux's ceremony.

### 5.6 Why plain JSON project files (no database at v1)
- Feature set does not require a server-backed DB. A project = one JSON "book model" + an `assets/` directory of images/fonts.
- Version snapshots are cheap copies/overrides of the model file on a timer and on save; recovery = open any snapshot.
- A cross-project library view (search across books, image folders) is a documented future option that can add SQLite without changing the model.

---

## 6. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  MAIN PROCESS (Node.js / Electron)                          │
│  • App lifecycle, windows, menu, dialogs (open/save/import) │
│  • File I/O: project read/write, autosave, snapshots        │
│  • Export orchestration (hidden renderer windows)           │
│  • Native dialogs, drag-drop import, print queue            │
└───────────────┬─────────────────────────────────────────────┘
                │ IPC (typed, contextBridge, contextIsolation)
┌───────────────▼─────────────────────────────────────────────┐
│  RENDERER — Editor (React + TipTap/ProseMirror)             │
│  • Writing editor, left nav, toolbar, right sidebar,        │
│    status bar, goals/sprint UI, find & replace              │
│  • <-> document transactions => canonical model             │
└───────────────┬─────────────────────────────────────────────┘
                │ single source of truth
┌───────────────▼─────────────────────────────────────────────┐
│  SHARED — Canonical Book Model + Core Services              │
│  (pure TypeScript, no Electron/React imports)               │
│  • Document schema & types (blocks/marks/pages/chapters)    │
│  • Model <-> ProseMirror converters                         │
│  • Smart quotes, word counts, goals calc                    │
│  • Theme model & theme application                          │
└───────────────┬─────────────────────────────────────────────┘
   ┌────────────┼────────────────┬───────────────┬────────────┐
   ▼            ▼                ▼               ▼            ▼
 EPUB EXPORT  PDF/PRINT      DOCX EXPORT     DEVICE        PERSISTENCE
 generator    pipeline       generator       PREVIEWS      writer
 (XHTML, OPF, (paged.js +     (docx lib)     (iPhone/iPad/ (JSON model +
 NCX, nav)    printToPDF)                    e-readers/    snapshots,
               + full-page                    print)         assets)
               pagination
```

### 6.1 Process boundaries
- **Main process:** OS integration only. No business logic in React components.
- **Shared core:** framework-free module (importable by main, renderer, and tests). All export and model code lives here and is unit-testable headlessly.
- **Renderer:** pure UI over the model; communicates over a **typed IPC** surface exposed via `contextBridge` with `contextIsolation: true` and `nodeIntegration: false`.

---

## 7. Canonical Book Model (sketch)

Single project file shape (versioned `schemaVersion` for migrations):

```jsonc
{
  "schemaVersion": 1,
  "book": {
    "details": { "title": "", "author": "", "projectName": "", "version": "",
                 "publisher": {}, "coverImage": "assets/cover.jpg",
                 "customTocTitle": "" },
    "frontMatter": [ "PageRef" ],
    "body":        [ "VolumeRef | PartRef | ChapterRef" ],
    "backMatter":  [ "PageRef" ]
  },
  "pages": { "<id>": { "kind": "chapter|page|fullpageimage|...",
                       "title": "", "includeIn": "all|ebook|print|none",
                       "beginOn": "auto|left|right", "numbered": true,
                       "hidden": { "heading": false, "number": false,
                                   "headerFooter": false, "toc": false },
                       "themeOverrides": {},
                       "content": "ProseMirror JSON doc" } },
  "volumes": { "<id>": { "title": "", "pageOrder": ["PageRef"] } },
  "parts":   { "<id>": { "title": "", "subtitle": "" } },
  "notes":   { "<id>": { "type": "footnote|endchapter|endbook",
                         "body": "ProseMirror JSON" } },
  "theme": { "chapterHeading": {}, "paragraph": {}, "subheadings": {},
             "sceneBreak": {}, "notes": {}, "print": {}, "typography": {},
             "headerFooter": {}, "trimSize": "" },
  "editorPrefs": {},   // display-only, never exported
  "goals": {},         // book goal + habit tracker (local)
  "meta": { "updatedAt": "", "stats": { "wordCount": 0 } }
}
```

- Blocks/marks allowed by the schema are defined once and reused by the editor, EPUB XHTML serializer, DOCX serializer, and print layout.
- Scene breaks, footnotes, internal links, and the TOC all derive from this model — never hand-authored.

---

## 8. Repository / Module Structure

```
glyphbook/
├─ package.json                  # electron-builder config (targets per OS)
├─ electron/                     # main process
│  ├─ main.ts                    # lifecycle, windows
│  ├─ ipc.ts                     # typed IPC handlers
│  ├─ files.ts                   # open/save/snapshot/import
│  └─ exporters/                 # hidden-window orchestration
│     ├─ pdf.ts                  # paged.js + printToPDF
│     ├─ epub.ts                 # invoke shared generator, write .epub
│     └─ docx.ts                 # invoke shared generator, write .docx
├─ src/
│  ├─ shared/                    # framework-free core (the "model" layer)
│  │  ├─ model/types.ts          # book model types (schemaVersion)
│  │  ├─ schema/                 # ProseMirror schema + doc<->model codecs
│  │  ├─ theme/                  # theme type + application to CSS
│  │  ├─ services/               # smartQuotes, wordCount, goals, findReplace,
│  │  │                          #   toc, sceneBreaks, imageSizeCalc
│  │  └─ exporters/
│  │     ├─ epub/                # XHTML serializers, OPF, NCX, nav, JSZip
│  │     ├─ print/               # CSS paged-media generation, pagination
│  │     └─ docx/                # docx-lib serializer
│  ├─ renderer/
│  │  ├─ app/                    # React root, routing (no router needed v1)
│  │  ├─ components/             # Toolbar, LeftNav, RightSidebar, StatusBar,
│  │  │                          #   PreviewPane, Dialogs (import/export/goals)
│  │  ├─ editor/                 # TipTap setup, node/mark extensions,
│  │  │                          #   footnotes, callout, text message, etc.
│  │  ├─ views/                  # Dashboard, Editor, Formatting, Preview
│  │  ├─ state/                  # Zustand stores
│  │  └─ styles/                 # Tailwind + editor/print CSS
├─ assets/fonts/                 # bundled OFL fonts
├─ tests/
│  ├─ unit/                      # Vitest: services, codecs, exporters
│  └─ e2e/                       # Playwright + export golden files
└─ docs/
```

---

## 9. Key Subsystem Decisions

### 9.1 Editing ↔ model synchronization
- ProseMirror transactions are serialized to the canonical model via a **doc ↔ model codec**. Debounced writes go to disk; on open, the file parses into the editor without intermediate HTML.
- Undo/redo handled by ProseMirror; document-level snapshot versions are separate from editor history.

### 9.2 Themes
- Themes are data (JSON), not code. A "theme compiler" produces the CSS + per-element styles consumed by the editor preview, device previews, and the print pipeline — guaranteeing preview == export.
- Preset themes ship as bundled theme JSON; custom themes are saved as theme JSON files in the user library. Duplicate / rename / delete are file operations.

### 9.3 Preview fidelity
- Editor preview, device previews (phone / e-reader frames), and print preview render the *same* generated book HTML/CSS inside scaled viewports, so authors see export truth.
- Device list (v1): iPhone, iPad, Galaxy, Kindle Fire/Paperwhite/Oasis, Nook Glowlight, Kobo Forma, generic tablet, Print.

### 9.4 Footnotes / endnotes
- Inline note nodes carry stable IDs. Print pipeline places notes per theme (foot of page / end of chapter / end of book); EPUB emits `<aside type="footnote">` with backlinks. Note text-size slider is a theme parameter.

### 9.5 Images
- In-app ops limited to sizing/compression via Canvas (matches spec: no crop/enlarge). `assets/` holds originals + generated variants; alt text and PPI metadata stored on the node. Pre-import image-size helpers ported from the Atticus calculator.

### 9.6 Export validation
- Before export, run a document validator: unresolved issues (e.g., untitled chapter, invalid note, oversize chapter heuristic) produce user-facing diagnostics instead of a broken file. This maps to Atticus's "export failure diagnostics."

---

## 10. Data & File Layout on Disk (user data)

```
~/Glyphbook/
├─ Library/
│  ├─ <BookName>.<version>.glyphbook.json   # canonical model + inline assets refs
│  ├─ <BookName>/assets/…                   # images, covers
│  └─ Snapshots/…                           # timed autosave versions (retention policy)
├─ MasterPages/                             # reusable page templates (same model subset)
├─ Themes/                                  # custom theme JSON
└─ settings.json                            # app prefs, last window state
```

- Format: JSON (pretty-print on save) — human-auditable and diff-friendly.
- Extension convention `.glyphbook` (JSON under the hood) registered for open-with; also supports plain `.json` export for backups.
- Autosave: debounced on edit + interval; snapshot retention (e.g., keep last N per book).

---

## 11. Security, Privacy & Offline Guarantees

- Zero network calls in the application. No telemetry, no analytics, no auto-update phoning home (updates shipped as manual installers or disabled).
- `contextIsolation: true`, `nodeIntegration: false`, sandboxed renderer; all privileged operations behind the typed IPC surface.
- Remote content never loaded; fonts/images are local. Paged.js and other vendored code ship locally.
- Any "universal link"/Booklinker-style feature is out of scope (network-dependent). Hyperlink creation is stored as data only; links are *not* fetched at runtime.

---

## 12. Quality Strategy

| Type | Tool | Focus |
|---|---|---|
| Unit | Vitest | services (smart quotes, word counts, TOC, goals), codecs, theme compiler |
| Golden-file | Vitest/CI | EPUB/DOCX output snapshots against fixture books |
| Print fidelity | Playwright + fixture PDFs | pagination diffs, header/footer, begin-on rules, widow/orphan modes |
| E2E | Playwright (Electron) | import → edit → export flows, dashboard CRUD, dialog flows |
| Lint/format | ESLint + Prettier | consistency |

- Export pipelines are pure functions → deterministic golden tests catch regressions cheaply.
- A "conformance fixture set" mirrors the feature doc: fiction book, nonfiction with callouts/lists, poetry (verse), a large-print config, and a footnotes-heavy book.

---

## 13. Packaging & Distribution

- electron-builder targets: Windows (NSIS installer, portable optional), macOS (DMG, notarization as post-build step), Linux (AppImage + deb).
- Bundle size mitigation: single archive context, icon set per OS, prune dev deps; monitor RAM during device-preview (render previews in one window, not one per device).
- First-run flow: empty library + "Start a Book / Import .docx" (import via docx parsing in the shared core; a `.docx` reader library is evaluated at scaffold).

---

## 14. Accepted Trade-offs & Mitigations

| Trade-off | Mitigation |
|---|---|
| Electron bundle size & memory | Acceptable for a desktop authoring tool; single-window design, lazy-loaded views |
| printToPDF header/footer limits | We render headers/footers ourselves via paged media; Chromium chrome disabled |
| Google Fonts Library scale | Bundle only fonts actually selected/needed for a book + ship curated heading set |
| paged.js maturity for complex novels | Early technical spike (§15.1); fallback = custom pagination passes (Vivliostyle engine) |
| DOCX styling fidelity | Intentional: DOCX is a content/backup format, not a design format (matches spec) |

---

## 15. Implementation Roadmap & Risks

### 15.1 Milestones
1. ✔ **Spike: print pipeline** — DONE and validated. paged.js `Previewer` in a hidden Electron window runs running headers (`@top-center`), page-number footers (`@bottom-center`), and chapter page-breaks; output captured via `webContents.printToPDF({ preferCSSPageSize: true })`. Sample book renders 4 pages → valid PDF (~25 KB). See `electron/main.ts` (IPC: `spike:*`), `src/print/`. Verify interactively with the "Print Spike" button on the Library screen, or headless: `GLYPHBOOK_SMOKE=1 npx electron --no-sandbox .`.
2. ✔ **Scaffold** — DONE. Electron + TypeScript (strict) + React + Tailwind v4 + TipTap + Zustand + Vitest + ESLint + Prettier; typed IPC via contextBridge (`src/global.d.ts`, `electron/preload.ts`); shared core layout (`src/shared`); three-screen UI shell per `UI_UX.md` (Library / Writing / Formatting); unit tests green. `npm run dev` (HMR) / `npm run build` / `npm run test` / `npm run lint` / `npm run typecheck`.
3. **Core model & editor** — schema, codecs, block/mark extensions, dashboard + CRUD, project save/load/snapshots.
4. **Writing tools** — word counts (scaffolded), goals/habit/sprint, find & replace, smart quotes, spellcheck integration, editor prefs.
5. **Book structure** — front/back matter (partially scaffolded via sections), TOC auto-generation, scenes, parts/volumes, page options (Include In, Begin On, numbering, per-chapter hides).
6. **Themes & formatting** — theme JSON + compiler, preset themes, custom theme builder UI, header/footer layouts, trim sizes, large print, notes settings.
7. **Imaging** — image insert options, full-page/bleed, alt text, image-size calculator.
8. **Previews** — device preview frames wired to the same generated output.
9. **Exporters** — EPUB3, DOCX, print PDF + validator diagnostics.
10. **Polish & packaging** — electron-builder installers, first-run, conformance testing against `atticus_features.md`.

### 15.2 Top risks
1. **Print pagination quality** (widow/orphan + balancing + blank-page correctness) — de-risked first via spike.
2. **DOCX import fidelity** (style/heading recognition, footnotes, `***` scene breaks) — isolate behind an import adapter with clear unsupported-feature warnings.
3. **Editor ↔ model divergence** — mitigated by single schema source of truth + golden tests.
4. **Performance on long books** — chunked model saves, lazy rendering of chapter list; test on 150k-word fixtures.

---

## 16. Open Questions to Resolve at Scaffold Time
1. Exact versions & compat matrix (Electron / React / TipTap / Tailwind / paged.js).
2. `.docx` import library choice (e.g., `mammoth`/`docx-preview` reader vs. custom XML walker) based on heading/style/footnote fidelity needs.
3. Product name/branding (working title "Glyphbook") and `.glyphbook` extension.
4. Whether "print costs / royalty calculator" and other marketing-adjacent helpers ship in-app or as docs.
