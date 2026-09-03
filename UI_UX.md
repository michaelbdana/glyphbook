# Glyphbook — UI & UX Specification (Atticus-Similar Interface)

> Working title: **Glyphbook**. Reference: `atticus_features.md`.
>
> Binding design input: **the application's user interface must closely mirror Atticus** — its three-screen model, screen layout, interaction patterns, and terminology — so that authors experienced with Atticus can use Glyphbook without retraining. We implement the *interface model and interaction patterns* with our own branding; we do not copy Atticus assets, copy, or screenshots.

---

## 1. Screen Model Overview

Atticus is organized around three primary screens plus reusable panels. Glyphbook replicates this model exactly:

1. **Library (Home / "My Books" dashboard)** — manage books, master pages, themes; start/upload/duplicate/delete; create boxsets.
2. **Writing Editor** — write and edit the manuscript (chapters, pages, scenes, notes, images).
3. **Formatting** — theme library + custom theme builder + live preview + export.

A persistent **preview panel** overlays/attaches to both the Writing and Formatting screens, and a **device-frame previewer** shows the book as it will appear on phones, e-readers, and print.

There is **no login, onboarding account screen, or collaboration UI** in Glyphbook (offline, single-user).

---

## 2. Global Chrome & Navigation Model

### 2.1 Top-level chrome (shared across screens)
- **Top center:** primary mode switch — **"Writing" | "Formatting"** (segmented control). Mirrors Atticus's top-center tabs.
- **Top left:** product logo / home button → returns to Library from anywhere (book state preserved).
- **Top right cluster:** (context-sensitive) **Save/Backup** button with saved-state indicator; **Support/Help** button; **Install/hide (PWA n/a)**; **user/profile** menu (in Glyphbook: app settings, library location, about, **Log out** replaced by *Close/Quit* semantics — no accounts).
- **Bottom status bar** (Writing screen): saving indicator, word count, sprint timer, and quick actions.

### 2.2 Navigation model
- Library → open book → Writing editor; switch to Formatting via top-center tabs; return to Library via logo/home.
- Within a book, the **left navigation pane** is the primary structure navigator (front matter / body / back matter; chapters, scenes, volumes, parts).
- Standard three-dot (**⋯**) menus on tiles/rows expose secondary actions (Duplicate/Delete, Rename, Sync, Edit-as-New, etc.), matching Atticus's pattern of gear icons (per-page settings) vs. three-dot menus (list-level actions).

---

## 3. Screen 1 — Library (Home Dashboard & "My Books")

### 3.1 Home dashboard
- Hero actions as large buttons/cards:
  - **Start a Book** (new book)
  - **Upload a Book** (import existing manuscript — opens Import dialog)
  - **Create a New Boxset**
- **Book tiles grid** — most recently worked-on first. Each tile shows: cover image (or placeholder), title, author, project name + version, and a last-edited timestamp.
- Per-tile **⋯ menu**: Duplicate, Delete.
- **See All** link → My Books manager.
- **Master Pages gallery** section on the home dashboard (thumbnail cards; ⋯ = Edit details / Sync to all books / Delete).

### 3.2 My Books manager
- Filter tabs: **All | Books | Master Pages**.
- **Search** field (matches title, author, project, version).
- **Sort** control: recently added (default), date modified, alphabetical, or by project/version.
- **View toggle:** Grid ↔ List.
- Clicking a book tile opens it in the Writing editor.

### 3.3 Import dialog ("Upload a Book")
- Modal with drop zone + file browser; requires **Title** and **Author**; optional **Project Name**.
- Confirms accepted format (.docx) and pre-import guidance (remove existing TOC/title/copyright; hyperlinks/images added later in app).
- Progress + result feedback; on success opens the imported book in the Writing editor.

---

## 4. Screen 2 — Writing Editor

### 4.1 Layout (left → right)
1. **Left navigation pane** — collapsible.
2. **Central editor** (the manuscript page/content area).
3. **Right sidebar** (writing tools) — collapsible.
4. **Bottom status bar.**
5. Optional **preview panel** on the far right (toggle): 3-pane layout = nav | content | live preview.

### 4.2 Left navigation pane
- **Book title row** at top (click = Book Details; contains Edit Book Details + options).
- Sections: **Front Matter**, **Body**, **Back Matter** (collapsible groups).
- Chapter/page list: reorder via **drag & drop**; reveal **scenes** inline (arrow to expand; scenes auto-named Scene 1, 2, …).
- Volumes and Parts render as nested group headers.
- **Add Chapter** button at the bottom of the pane, with an adjacent **⋯** menu exposing special inserts: **Copyright Templates, Preset Layouts (Prologue/Epilogue/Blurbs/Foreword/Preface/Introduction/Dedication/Epigraph/Also By/About the Author/Acknowledgements/Afterword), Title Page, Chapter, Full Page Image, Import Chapters (.docx), Master Pages**.
- Per-item **⋯** menus: Duplicate?/Merge with next chapter/Split-related, Hide in TOC, Include In, Begin On, Numbered, per-chapter hides, Save as Master Page, Create Part/Volume (right-click or ⋯), Delete (Keep Children / Delete Children for parts).

### 4.3 Top toolbar (over the editor)
Mirrors Atticus's row of tools (left → right, roughly):
- **Style/block dropdown** (Body, Subheading H2–H6, Block Quote, Verse, Callout).
- Character formatting: **B** **I** **U**, then overflow (via arrow): Strikethrough, Subscript, Superscript, Monospace, Small Caps, Sans-serif.
- **Alignment + Lists** (unordered/ordered).
- Insert controls: **Link**, **Social/Profiles (@)**, **Image**, **Footnote (1)**, **Callout / Text Message**, **Scene Break (∗)**, **Page Break**, **Hanging Indent**.
- Chapter actions: **Split Chapter**.
- Selection-based mini behaviors with tooltips (industry standard).

### 4.4 Right sidebar (writing tools)
Ordered tool icons (Atticus-style stack), opening panels:
- **Editor Settings** (personal, display-only prefs: font, size, line height, indented vs. spaced paragraphs, justification).
- **Find & Replace** (book-wide; Sync-All-Chapters affordance).
- **Goals** (Book Goal: target words + due date + writing days → per-day calc; Writing Habit Tracker: daily word target, committed days, calendar streaks — flame when goal hit).
- **Sprint Timer** (session + break interval).
- **Smart Quotes** (apply per chapter) + consistency indicator.
- Preview toggle / export quick action.
*(Collab panel is out of scope.)*

### 4.5 Status bar (bottom)
- Saving… / Saved indicator; **Word count** (book / chapter / selection); Sprint Timer status; **Export to .docx** quick button; chapter/page context.

### 4.6 Editor canvas behavior
- Clean writing surface; page-margins are *not* shown while writing (Atticus shows a plain manuscript feel) — theme fidelity appears in Preview and Formatting.
- Front/back-matter pages and chapters open in the same editor; gear icon (page-level options) appears contextually (e.g., below the title or beside the page).

---

## 5. Screen 3 — Formatting & Theme Builder

### 5.1 Layout
- **Left/center:** theme library & builder panels.
- **Right:** live **Previewer** pane (device selector dropdown above; **Print** option; **total page count** rendered beneath the preview; **Export ePub / Export PDF** buttons directly under the previewer).

### 5.2 Theme library
- Grid/carousel of **preset theme thumbnails** that instantly reflect font, size, line spacing, margins, and chapter-title choices; arrows to page through; **Heart** icon to favorite/pin a theme to the front.
- **Create a New Theme**; per-theme **⋯**: Edit, Edit as New Theme, Rename, Duplicate, Delete.
- Selected theme applied live to the preview.

### 5.3 Custom theme builder
Atticus-style organized builder with these sections (left list of "theme elements"; content panes to the right; **Save as New Theme** at top with unsaved-changes leave warning):
- **Chapter Heading** — toggles for Chapter Number / Title / Subtitle with per-element font/size/style/alignment; Chapter Image (same-every-chapter or per-chapter individual images) with placement/size; Background Image (bleed/full-page, opacity, light-text toggle).
- **Paragraph Settings** — first-sentence formatting (Drop Caps, Lead-in Small Caps; chapter-start vs also-after-scene-breaks), indent vs. spaced paragraphs.
- **Subheadings (H2–H6)** — per-level styling.
- **Scene Break** — with image (ornamental, width %) / without / none; uploads.
- **Notes Settings** — placement (footnotes vs end-of-chapter vs end-of-book; per print & eBook), text-size slider, Categorize by Title, Include Chapter Title, custom endnotes title.
- **Print Layout** — margins, trim size (color-coded KDP/IngramSpark), layout-priority mode (Widows & Orphans / Balanced Page Spread / Best of Both), keep options, justification/hyphenation.
- **Typography** — body font/family, font size, line spacing, Large Print preset.
- **Header & Footer** — layout picker thumbnails; fields book title/chapter title/author/page number; font/size.
- (Advanced settings where noted.)

### 5.4 Previewing
- **Device preview list:** iPhone, iPad, Galaxy, Kindle Fire / Paperwhite / Oasis, Nook Glowlight, Kobo Forma, generic tablet, and **Print**.
- **Print preview is true-to-export** (shows running headers/footers, blank pages, page count); clicking the print preview opens a single-chapter PDF.
- Preview font selector affects preview only; eBooks render reflowable.
- Links are clickable/testable inside previews.

---

## 6. Shared Interaction Patterns (Atticus conventions)

- **⋯ three-dot menu** — secondary list/tile actions.
- **Gear icon** — per-chapter/page settings (Chapter Options: Hide Chapter Image/Heading/Page Number/Header & Footer/First-Sentence Formatting, Hide in TOC, Use Smaller Chapter Title, Invert Text Color).
- **Drag & drop everywhere** — reorder chapters/pages/scenes, move between Front Matter/Body/Back Matter, drag master pages into a book, reorder volumes/parts.
- **Tooltips** on all icon-only buttons (Atticus uses explanatory tooltips).
- **Modals** for: import, export flow (PDF render "ready" green-light), goals editor, master-page sync confirmation (with "apply to all books" semantics), destructive actions (delete book, delete part w/ Keep/Delete Children).
- **Unsaved-leave warning** when leaving the theme builder with unsaved changes.
- **Inline contextual options:** image gear (caption, alignment, wrap, separate page, size, link, alt text), link pencil (edit/visit/delete).

---

## 7. Terminology (match Atticus vocabulary)

Reuse Atticus's established terms so users transfer knowledge directly: *Book/Upload a Book/Start a Book, Boxset, Front Matter/Back Matter/Body, Chapters, Scenes, Parts, Volumes, Master Pages, Themes / custom theme, Chapter Options, Include In (All/eBook/Print/None), Begin On (Right/Left/Either), Hide from Table of Contents, Numbered chapters, Drop Caps, Lead-in Small Caps, Scene Break, Page Break, Split Chapter, Smart Quotes, Book Goal, Writing Habit, Sprint Timer, Editor Settings, Previewer, Device previews, Export ePub/PDF, Large Print, Trim Size, Bleed.*

---

## 8. Visual Language (own branding, same "feel")

- Clean, modern, distraction-light desktop UI; generous whitespace; neutral light theme as default with a single strong **brand accent** (Atticus uses its red; Glyphbook defines its own accent).
- **Dark mode** supported (app-level setting) — matches Atticus's Jan-2026 dark theme.
- Type: system UI font stack for chrome; bundled book fonts only inside editor/preview where theme fidelity matters.
- Icons: consistent outline icon set (lucide-react) with tooltips; text labels for primary actions.
- Window chrome: standard OS frame (title bar) with in-app top bar below it.
- Layout is fluid but with sane minimum sizes; sidebars collapsible; state persisted (last screen, pane widths, chosen device).

---

## 9. Responsive & Window States

- Desktop-first; gracefully narrow to smaller laptop/tablet widths (collapsible panes, toolbar overflow into ⋯).
- Preview panel and sidebars remember open/closed state per session.
- Empty states: empty Library (welcome + Start/Upload/Boxset), empty search results, no master pages yet, book without chapters.

---

## 10. Keyboard & Efficiency

- Standard editing shortcuts (copy/paste, paste-without-formatting `Ctrl/CMD+Shift+V`).
- Atticus-documented OS character shortcuts for smart quotes/em-dash/etc. honored in Help.
- Focus navigation: no required mouse-only flows (tab/enter/escape through dialogs).

---

## 11. Help & First Run

- First-run dialog: choose Start a Book / Upload a Book / open practice sample; link to built-in quick-start guide.
- Built-in Help (offline): quick-start, formatting guide, keyboard shortcuts, glossary — local content, no web dependency.

---

## 12. Deliberate Omissions (vs. Atticus UI)

Removed because Glyphbook is offline and single-user:
- Login/account screens, profile/avatar flows.
- Collaboration tab, invites, roles, comments/tracked-changes UI.
- Cloud backup/restore wording → replaced with local **Backup** (export snapshot .json) and **Snapshots** (local version history) affordances.

---

## 13. UI Component Inventory (implementation checklist)

Global: TopBar, ModeSwitch (Writing/Formatting), IconButton, Tooltip, ⋯Dropdown, Modal, EmptyState, Toast/Notification.
Library: BookTile, BookCover, BookMenu(⋯), MasterPageCard, ThemeCard, UploadDialog, NewBookDialog, BoxsetWizard, MyBooksToolbar (tabs/search/sort/view).
Editor: NavPane (tree, sections, drag), ChapterTreeItem, SceneItem, VolumeHeader, PartHeader, AddChapterMenu, Toolbar, StyleDropdown, MarkButton, InsertMenu, SidebarRail, Panel (EditorSettings/FindReplace/Goals/HabitTracker/Sprint/SmartQuotes), StatusBar, GearMenu(ChapterOptions), PreviewToggle.
Formatting: ThemeGallery, ThemeCarousel, ThemeThumbnail, ThemeBuilder (section nav + editor panes), TrimSizePicker, FontPicker, FontGallery (Favorites/Library, search, filters), HeaderFooterPicker, NotesSettings, PrintSettings, LayoutPriorityPicker.
Preview: PreviewPane, DeviceDropdown, DeviceFrame (phone/tablet/e-reader/print), PageCountLabel, ExportButtons (ePub/PDF), ChapterPDFLink.
Shared: ConfirmDialog, ProgressDialog, PDFProgressDialog, ImageOptionsDialog, LinkEditor, ImagePicker, SaveIndicator.

---

## 14. Acceptance Criteria (UI parity)

1. A user familiar with Atticus can perform Start/Upload, write & organize chapters/scenes, apply a theme, preview on a device, and export ePub/PDF **without a tutorial**, using the terminology and locations above.
2. All primary actions reachable in ≤ 3 clicks and have tooltips/labels.
3. Preview == export fidelity (same generated output rendered in preview, device frames, and print).
4. The three-screen model with top-center Writing/Formatting switch and logo-home is present on every screen.
5. Dark mode + light mode both complete.
