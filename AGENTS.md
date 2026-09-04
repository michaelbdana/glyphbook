# AGENTS.md — Glyphbook working guide

Guidance for AI/agent contributors (and humans) making changes to this repository. Read this before editing.

## What this is

Glyphbook is an **offline, desktop book-writing and formatting app** (Electron). Authors write a manuscript, organize chapters/front matter/back matter, apply themes, configure print versions, and export print PDFs, store-specific ePubs, and DOCX. **No login, no cloud, no network calls.** All data lives locally under the OS userData dir.

## Commands

```bash
npm install            # first time
npm run dev            # build main + Vite HMR + open Electron window
npm run build          # compile electron (tsc) + renderer (vite) into dist-electron/ + dist/
npm start              # run the production build (dist + dist-electron must exist)
npm run typecheck      # strict TS: renderer/shared (tsconfig.json) + electron (tsconfig.electron.json)
npm test               # Vitest unit tests (tests/*.test.ts)
npm run lint           # ESLint (flat config, typescript-eslint + react-hooks)
npm run format         # Prettier write
npm run icon           # regenerate build/icon.png (dev dep pngjs)
npm run dist / dist:linux / dist:win / dist:mac   # electron-builder (per-OS)
npm run pack:dir       # unpacked build in release/<platform>-unpacked
```

## Non-negotiable conventions

- **No code comments** unless the user explicitly asks for them.
- **TypeScript strict** across renderer and electron; no `any` (lint rejects `require()` imports too).
- Keep ESLint/Prettier clean: run `npm run lint` after changes; `noUnusedLocals`/`noUnusedParameters` are on.
- **Fully offline.** Never add network calls, analytics, auto-update phoning home, or remote content. No new runtime deps that require services.
- **No committing unless asked.** The user asks explicitly each time.
- Prefer editing existing files; don't create docs (`.md`) unless requested. `README.md` is intentionally the only doc.
- **Keep `README.md` current**: any change that affects features, behavior, commands, data locations, or Linux/macOS/Windows requirements must be reflected in `README.md` in the same change.

## Architecture map

- `electron/main.ts` — app lifecycle, windows, all `ipcMain.handle` wiring. Compiled by `tsc` to `dist-electron/electron/`, so `package.json` `"main"` = `dist-electron/electron/main.js`.
- `electron/preload.ts` — `contextBridge` exposing `window.glyphbook`. **Preload hardcodes the IPC channel strings** (it can't `require()` the shared IPC const under sandbox); keep names in sync with `src/shared/ipc.ts` and `electron/main.ts`.
- `electron/importers/docx.ts` — .docx import: parses raw OOXML (paragraph styles, page breaks, centering, runs, character/paragraph style chains incl. `w:i/w:b val=0`), segments chapters via heuristics (`src/shared/services/outline.ts`), captures the first drawing as the cover.
- `electron/exporters/epub.ts` + `docx.ts` — in-process generators. Epub honors store profiles from `src/shared/model/epubProfiles.ts`.
- `electron/library.ts`, `electron/settingsStore.ts` — per-book `.glyphbook` file I/O (atomic writes, unique default paths under Documents/Glyphbook Books), the recent-books shelf (`bookshelf.json` under userData/library), and the one-time migration of the old `library.json`.
- `src/shared/**` — **framework-free** core (model types, validation, services, theme/print/epub profiles, ebook HTML renderer, print CSS compiler). Importable from main, renderer, and tests. Never import React/Electron here.
- `src/renderer/**` — React UI. `state/store.ts` (Zustand) is the app store; `state/settingsStore.ts` UI prefs; `state/usePersistedWidth.ts` uses `localStorage`. `screens/` are the three big screens; `components/` dialogs/panels; `editor/` TipTap setup + extensions.
- `src/print/` — the hidden paged.js print window (separate Vite entry). **It loads the built file `dist/src/print/index.html`, even in dev** — after editing `src/print/*` you must `npm run build:renderer` for changes to take effect.
- `src/global.d.ts` — the `window.glyphbook` API type (`GlyphbookApi`); renderer/preload/main must stay in agreement. `tests/` — Vitest.

## Canonical data model (single source of truth)

`src/shared/model/types.ts` — `Book` → `chapters` (`Chapter[]`), `parts`, `volumes`, `goals`/`habit`/`habitLog`, `themeName` + `theme` (overrides), `cover`, `prints` (`BookPrint[]`).

- Chapter content is **ProseMirror JSON** (`ProseDoc`). Node kinds: `paragraph`, `heading` (attrs.level 2–6, attrs.textAlign), `bulletList/orderedList/listItem/blockquote/horizontalRule`, `imageBlock` (attrs.src data-URL), `sceneBreak`, plus a `kind` field for page type (`cover|title|copyright|toc|dedication|…|fullpage`) and `section` (`front|body|back`).
- `src/shared/model/validation.ts` — no-data-loss sanitizer used on every save/load; **never drop unrecognized nodes** (forward-compatible cloneAs pass-through). Extend it whenever you add persisted fields.
- `src/shared/model/prints.ts` — print versions (Paperback/Hardcover/LargePrint defaults, trim catalogs, margins, bleed, ink/paper, typography, header/footer boxes with macros).
- `src/shared/model/theme.ts` + `services/themeCss.ts` — theme data and the print CSS compiler. `PrintContext` carries `bookTitle`, `authorName`, `bleed`, and `headers` (margin boxes). `{page}/{total}/{book}/{author}/{chapter}` macros expand to `counter(page)/counter(pages)/strings/string(chapter)`.
- `services/ebookHtml.ts` — shared recursive block→HTML renderer (used by device preview, eBook, and print body). `services/wordCount.ts` + `findReplace.ts` walk nested structures generically.

## Key gotchas

- **Print page theme**: `export:get-theme` IPC returns the effective theme merged with the chosen `BookPrint` (geometry/typography/bleed). PDF filename = `Title-<PrintLabel>.pdf`.
- **ePub store profiles**: Kindle profile must remove the interior cover page (Amazon adds the cover); others keep it. Cover metadata uses `properties="cover-image"` + `<meta name="cover">`.
- **Electron `console-message` typing quirk**: use the single-param `(details) => …` handler, not `(event, level, message, …)`.
- **Headless smoke tests** (read-only sanity): env vars `GLYPHBOOK_SMOKE=1` (print window), `GLYPHBOOK_SMOKE_SAVE=1`, `GLYPHBOOK_SMOKE_EXPORT=1`, with `GLYPHBOOK_TMP_USERDATA=/tmp/…` to redirect data and `GLYPHBOOK_BOOKS_DIR=/tmp/…` to redirect the default book-files folder. Launch as `npx electron --no-sandbox .`.
- **Linux packaging**: Electron may need `--no-sandbox`/`--ozone-platform-hint=auto`; the README documents this.
- **The fixture book** `AccidentalSorceress-master.docx` is git-ignored (copyrighted); `tests/docxImport.test.ts` skips automatically when absent. Don't commit it.
- **Don't paste from outside the app** is a product rule for users, not a code constraint.

## Test/lint hygiene before you finish

Run `npm run typecheck && npm test && npm run lint && npm run build`. If you touched `src/print/*`, rebuild and consider `GLYPHBOOK_SMOKE=1 npx electron --no-sandbox .` to verify pagination. Keep new logic in `src/shared/**` where possible and add a `tests/*.test.ts` for pure functions.

## History/style notes

- All prior feature spec/design docs were deliberately deleted (README is the only doc). The feature set is described fully in `README.md`.
- Git identity: repo-local `Michael Dana <michaelbdana@yahoo.com>`; commit messages follow imperative summaries like the git log.
