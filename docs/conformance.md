# Glyphbook — Feature Conformance

Coverage status against the compiled Atticus feature spec (`atticus_features.md`), as of the completion of DESIGN.md milestone 10. Out-of-scope items are marked **OOS** (offline, single-user product decision).

## Core capabilities

| Area | Status |
|---|---|
| Offline desktop app (Windows/macOS/Linux/Chromebook-class browsers) | ✔ PWA/Electron — packaged Linux dir verified; Win/macOS targets configured |
| No login / no cloud / local-only storage | ✔ design decision (no auth/telemetry code paths) |
| Book library CRUD (start/upload/duplicate/delete/versions, search+sort later) | ✔ |
| Book details (title, author, project, version) | ✔ |
| Autosave, timed snapshots, per-book .json export | ✔ |
| First-run welcome + empty library | ✔ |

## Writing

| Area | Status |
|---|---|
| Rich editor (TipTap): paragraph, H2–H6, lists (basic), alignment | ✔ |
| Bold/italic/underline/strikethrough/sub/sup/mono/small-caps/sans marks | Partly (underline/sub/sup not surfaced; mono/small-caps/sans/bold/italic ✔) |
| Scene breaks (insert, style from theme, import of `***`) | ✔ insert + theme; multi-scene nav not built |
| Hyperlinks, internal links, social profiles, booklinks | Not built (styling-level) |
| Smart quotes (whole-book conversion, checked) | ✔ |
| Find & replace (book-wide, replace-all) | ✔ |
| Word counts (book/chapter/selection) | Book ✔; per-selection counter not surfaced |
| Goals (book goal, words/day) | ✔ |
| Writing habit tracker (daily words, streak) | ✔ (auto word log) |
| Sprint timer | ✔ |
| Editor display prefs (font/size/line height/paragraph style) | ✔ persisted per account (settings.json) |
| Spellcheck toggle | ✔ (Electron built-in) |

## Book structure

| Area | Status |
|---|---|
| Front Matter / Body / Back Matter sections | ✔ |
| Auto Title / Copyright / TOC pages on new books & imports | ✔ (TOC is an empty placeholder page; real auto-TOC listing pending export/print wiring) |
| Preset page layouts (Dedication, Epigraph, Blurbs, Prologue, etc.) | ✔ kinds + labels |
| Parts & Volumes with keep-children delete | ✔ |
| Chapter options (Include In, Begin On, hide heading/page #/header-footer/TOC, smaller title, invert text) | ✔ stored (enforced in eBook/PDF spine + preview include) |
| Chapter split/merge, reordering, drag across sections | ✔ reorder + split of long chapters not surfaced as tool |

## Themes & formatting

| Area | Status |
|---|---|
| Theme-as-data + effective theme merge + presets | ✔ 6 presets |
| Print CSS compiler (trim, margins, headers/footers, page numbers, drop caps, layout notes) | ✔ |
| Custom theme builder UI | ✔ core controls |
| Header/footer layouts, notes placement, large print | ✔ (via theme) |
| Trim sizes w/ retail hints | ✔ catalog |
| Image size calculator | ✔ |
| Device previews + print preview | ✔ |

## Imaging & export

| Area | Status |
|---|---|
| Inline images (align/width/caption/alt/wrap/separate page/remove) | ✔ embedded data-URL |
| Full-page image chapters | ✔ |
| Print PDF export | ✔ publish-ready pages via paged.js |
| EPUB3 export (OPF/nav/NCX, TOC from chapters, styles) | ✔ |
| DOCX export | ✔ |
| .docx import | ✔ robust: parses raw Word XML for paragraph styles, page breaks, centering, and run formatting; auto-detects chapter boundaries using heuristics (Heading 1–3, "Chapter/Prologue/Part…" markers, page-break-started centered titles) so manuscripts not using Heading-1 conventions still split correctly |
| Export diagnostics | Not built (failures surface via dialogs) |

## Deferred / not built (parity gaps)

- MOBI export (out of scope — Amazon dropped it)
- Cloud sync, accounts, collaboration roles, comments/tracked changes — **OOS**
- Social-profile/link icons & Booklinker integration — **OOS (offline)**
- Version control history browser (only book-level version field) 
- Boxset compilation from multiple books
- Underline / sub / superscript toolbar buttons (schema marks can be added)
- Per-chapter scene list UI and chapter-split toolbar action
- Search/sort within My Books manager beyond name search? (search implemented, sorting not exposed)
- Print "balanced pages / widow-orphan" engine tuning beyond basic widows/orphans CSS
