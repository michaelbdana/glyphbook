# Feature Reference — Complete Feature Specification

Compiled from the public website of the reference product: its homepage, changelog, tutorials, pricing, and public feature roadmap.

This document is intended as the reference spec for building a new book-writing and book-formatting application. The reference product is a one-time-purchase, cross-platform **Progressive Web App (PWA)** that combines a distraction-light word processor, a manuscript/print/eBook formatter, and an exporter into a single tool built for fiction and non-fiction self-publishing authors.

---

## 1. Product Overview

- **What it is:** An all-in-one book writing + formatting tool for authors. Write a manuscript, then format it into publish-ready files for eBook and print markets.
- **Tagline / value prop:** "Write and format stunning books." One file drives both **ePub** (digital) and **PDF** (print) exports.
- **Target user:** Self-publishing authors (fiction & non-fiction, novels, memoirs, nonfiction, journals/planners), working alone or with collaborators (co-writers, editors, beta readers).
- **Platform model:** Progressive Web App — installs and runs on Windows, macOS, Linux, ChromeOS (via Chrome) and iOS/Android tablets & phones (Safari on iOS). Works **online and offline**.
- **Pricing model:** One-time purchase ($147 USD). No subscription. Includes "ongoing updates for life" and unlimited books, pen names, and exports. 30-day money-back guarantee.
- **Ownership:** Pay-once, own-forever positioning — "no forced subscriptions or compatibility concerns." The author owns their files; backups are downloadable.
- **Company context:** Built by the Kindlepreneur / Dave Chesson team. Competitors compared against: Vellum (Mac-only, $249). Key differentiators claimed vs. Vellum: cross-platform, custom chapter theme builder, volumes/parts, large print, footnotes, H2–H6 headings, callout boxes, cloud storage/backups, 1,500+ fonts, 17+ chapter themes, DOCX export, full-bleed images, version control (roadmap), callout boxes.

---

## 2. Access, Platform & Install

### 2.1 Access methods
- Web app entry point: **the reference app address** (login with email + password). The website's buy link is on ThriveCart; after purchase an account-creation email ("Create Your the reference product Account") arrives (~10 min), containing a "Get Started with the reference product" button that lets the buyer set a password (login is always the email address).
- **Two ways to use:**
  1. Directly in a web browser on any device.
  2. As an **installed PWA** (standalone window) — appears in the OS taskbar/dock/home screen/apps folder like a native app, launched without opening a browser.
- **Installation (PWA):**
  - Desktop (Win/Mac/Chromebook/Linux): in Chrome, go to the reference app address → click the in-app "Install" button (top right) or the browser URL-bar install icon → confirm. Mac: file lands in Chrome Apps; drag into Applications or taskbar. Windows: drag to desktop. Right-click taskbar/dock icon → Pin.
  - iOS (iPad/iPhone): Safari → the reference app address → Share → **Add to Home Screen** → name it → Done.
  - Android: Chrome → the reference app address → bottom popup "Add the reference product to Home Screen" → Install; fallback = three-dot menu → Add to Home Screen.
- **Browser guidance:** Chrome strongly recommended (desktop + Android); Safari on iOS; Edge explicitly **not recommended** (known issues).
- Installed app is "always tied to your browser" but opens standalone; syncs automatically.

### 2.2 Offline behavior
- Requirement: be logged in with the app/browser open before losing connectivity.
- **Works offline:** writing and formatting the currently-open project; autosave to a local server/IndexedDB.
- **Does NOT work offline:** importing documents, exporting documents, switching between books.
- **Sync:** on reconnect, all offline changes auto-sync to the cloud. Logging out force-syncs the whole account.
- Per-device usage: designed ideally for one device at a time; recommended to log out on one device (force-syncs) before logging into another.

### 2.3 Updates
- Updates are rolled out automatically (no manual update step). If behavior misbehaves after an update/browser update, hard-refresh (bypass cache):
  - Windows Chrome `CTRL+Shift+R`; Mac Chrome `CMD+Shift+R`; Safari `Option+Command+E`; Firefox `CTRL+F5`.
- If hard refresh fails: clear cache/cookies fully; support email escalation.

### 2.4 Supported surfaces in the app
- Left navigation pane (chapters/pages/volumes), top toolbar (text tools), status bar (bottom), right sidebar (writing tools), central editor, and a preview panel.
- Logout / user menu: profile icon (top right) → Logout.

---

## 3. Account, Dashboard & Book Management

### 3.1 Home dashboard ("My Books")
- Lists all books and master pages, most recently worked-on first.
- Primary actions: **Upload a Book**, **Start a Book**, **Create a New Boxset**.
- **See All** opens the My Books dashboard.
- Practice-book .docx download offered (e.g., "Little Dog Ready").

### 3.2 My Books dashboard (management UI)
- Tabs/filters: **All, Books, Master Pages**.
- **Search** by title, author, project, or version.
- **Sort** by title, author, project, version; or recency / date modified / alphabetical. (Book tiles show title, author, project name, version, and timestamps.)
- **View toggle:** Grid view or List view.
- Per-book **three-dots** menu: **Duplicate** book, **Delete** book.
- Book detail editing ("Edit Book Details"): title, author, project name, version, publisher details, eBook cover upload, custom TOC title; located top-left next to the book title in the editor.
- Version control: books can carry a **Version name**, and version naming/sorting on the home page is supported (per changelog).

### 3.3 Backup & cloud storage
- **Autosave** as you type ("every few characters") to local storage + cloud.
- **Backup Content (Save)** button (top bar / dashboard) — force-syncs entire account and downloads a **.json backup file** that can restore the account.
- **Download Snapshot** (per-book, in Edit Book Details) — force-syncs that book and downloads a **.json** restore file.
- **Automatic backup on logout.**
- Support button (top navigation) and in-app notifications.

### 3.4 Templates / master pages
- **Master Pages** are reusable pages (e.g., "Also By," "About the Author," review-request/CTA pages) saved from any book and reused across all books in the account.
- Create: design the page in a book → three-dots on the page title → "Save as a master page" (named from the page's title).
- Insert into another book: three-dots beside Add Chapter → Master Pages → drag-and-drop into place.
- Sync: a master page's pages show an "Apply Changes" button (bottom right) — without clicking, edits affect only that one book; clicking syncs the change to **all books using it** (with confirmation popup). Gallery on the home dashboard offers Edit details / Sync to all books / Delete.
- Master pages adopt each host book's theme (formatted per-book when inserted).

### 3.5 Book organization (per changelog/roadmap)
- Recent (Aug 2026): **folders / organizational system for images**; roadmap includes a planned "Book & Boxset Organization System" (folders for projects).

---

## 4. Import

### 4.1 Supported import formats
- **.docx** (Microsoft Word / Google Docs) — the primary and effectively only supported full-import format. "the reference product currently cannot import your book unless it is .docx."
- Historically also: **.rtf import** and **ePub import** and "mobi import (not perfect but functional as a last resort)" appear in the changelog; the current docs emphasize .docx.
- **Drag-and-drop .docx into an existing book** (imports additional chapters into an open book) is supported.
- Import UI: Upload a Book dialog — browse **or** drag-and-drop; requires a Title and Author; optional Project Name.

### 4.2 Automatic structure recognition on import (from .docx)
- **Heading 1** style (or text at 20 pt+) → **Chapter Title**.
- **Heading 2** (or 18 pt) → **Subheading**; Word default styles Heading 2–Heading 6 map to up to 5 subheading levels (H2–H6).
- **Page breaks** or **three consecutive empty lines** → new chapter delimiters.
- Three consecutive asterisks `***` **left-aligned, unformatted** → auto-converted to **scene break placeholders** (centered asterisks will not convert).
- Word **Footnotes** import (must be Word Footnotes, not endnotes). Endnotes must be converted to footnotes in Word first.
- Non-default Word styles (Emphasis, Strong, etc.) do **not** import — they flatten to plain text; only direct formatting (italic/bold applied via the font menu) survives.

### 4.3 Import preparation guidance (product behavior worth replicating)
- Delete existing front matter (title page, copyright, TOC) before import — the reference product **auto-generates Title Page, Copyright Page, and a fully auto-linked Table of Contents** for every book.
- Remove hyperlinks before import (Word: Ctrl+A then Ctrl+Shift+F9 ×2 / Mac: Cmd+Fn+Shift+F9 ×2) and re-add inside the reference product (foreign hyperlink coding can block import/export).
- Remove large/many images before import (insert from inside the reference product later); remove unsupported emojis/symbols/special characters.
- Imported manuscript lands in the **Body** section; front/back matter can be drag-and-dropped to their sections afterward; chapters renumber automatically.

---

## 5. Writing Editor

### 5.1 Editor layout & fundamentals
- Central writing area; left navigation pane (pages/chapters); top toolbar; bottom status bar; right sidebar of writing tools; bottom-right **Preview** toggle that splits the view (nav | work | live preview).
- Full word-processor editing: bold, italics, underline; copy/paste; undo/redo buttons; keyboard shortcuts (standard).
- **Copy/paste from external programs is discouraged** (hidden code corrupts exports/formatting). "Paste as plain text" is provided: keyboard `CTRL/CMD+Shift+V` and right-click menu **"Paste as plain text."** Built-in protections reduce but don't eliminate risk from pasted foreign content.

### 5.2 Character / paragraph formatting
- Toolbar character tools (via "more" arrow): **Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Monospace, Small caps, Sans-serif** (Sans/Serif/Mono used e.g. to simulate text-message or email style).
- Paragraph styles (dropdown): **Body, Block Quote, Verse, Callout/Text Message, headings (H2–H6)**, etc.
- **Lists:** unordered (bullets) and ordered (numbered), with improved ordered-list schemes (1, a, i …).
- **Alignment:** left/right/center/justified.
- **Hanging indent** button (for reference pages/citations/bibliographies and long dialogue/poetry).
- **Hyperlinks:** insert live links (need http:// or https:// prefix; auto-added if missing), edit/visit/delete; **internal links** (to any page/chapter by title — TOC is auto-created & auto-linked); **Universal Book Links** via Booklinker integration (create "where to buy" link, auto bridge page, shortened URL); **QR codes** for print (insert image so print readers can scan).
- **Social media profiles:** @ button → create named profile groups; supported platforms: Amazon, BookBub, Facebook, Goodreads, Instagram, LinkedIn, Patreon, Pinterest, Snapchat, Twitter, TikTok, YouTube. Icons render as live links in digital preview/export, and as full URLs beside icons in Print (print is non-interactive).
- **Smart quotes:** typed text defaults to straight quotes; smart/curly quote algorithm converts per chapter (button in right sidebar); grammar-aware, handles common slang/apostrophes (’cause, ’em); consistency checker reports chapters by smart / straight / mixed state.

### 5.3 Writing tools (right sidebar)
- **Editor Settings** — personal content-editor preferences: font, font size, line height, indented vs. spaced paragraphs, justification. These are per-account **display-only** settings (never exported; the theme governs output).
- **Find and Replace** — book-wide search & replace, with "Sync All Chapters" option so collaborators' recent changes on other devices are included.
- **Goals** — see Section 11.
- **Smart Quotes** applicator.
- **Collab** panel (Comments / Track Changes) — see Section 15.
- **Word count** — book, chapter, and selected-text counts; status bar shows live word count.
- **Sprint timer** — timed writing sprints + breaks.
- **Spell check** — in-app spell check (roadmap item).

### 5.4 Navigation pane & chapter operations
- **Add Chapter** button; three-dots beside it add special page types: **Copyright templates, Preset Layouts, Title Page, Chapter, Full Page Image, Import Chapters (.docx), Master Pages**.
- **Drag-and-drop** chapters/pages to reorder (auto-renumbering; auto TOC update).
- Per-page **gear icon = Chapter Options Menu** (overrides): Hide Chapter Image; Hide Chapter Heading; Hide Page Number; Hide Header/Footer; Hide First Sentence Formatting; Hide in Table of Contents; Use Smaller Chapter Title; Invert Text Color. Plus per-chapter **Include In (All / eBook / Print / None)**, **Begin On (Left / Right / Either)**, **Numbered** checkbox, "start on page" style options.
- **Split Chapter** (toolbar) — splits at cursor; "SPLIT" appended to new title (un-numbered workflow for >8k-word chapters).
- **Merge with next chapter** (three-dots) — appends next chapter; its title becomes a subheading.
- Chapter **Scenes**: scene breaks inserted via asterisk tool; auto-named Scene 1, 2, 3…; draggable/reorderable; scene titles are reference-only (never export); trash-can on the break merges the scene back (doesn't delete content).
- **Parts & Volumes:** right-click → **Create Part** (Part title/subtitle; nested chapters; delete with "Keep Children" vs "Delete Children"); **Create a Volume** from a range of chapters (SHIFT+click) for multi-volume books; each volume gets its own front matter. See Boxsets (Section 8).
- Long chapters: best performance ≤ ~8,000 words.

---

## 6. Book Structure: Front Matter / Body / Back Matter

- Every book = **Front Matter + Body + Back Matter**, managed in the left nav.
- Auto-generated pages (per new/imported book): **Title Page, Copyright Page, Table of Contents**. All but the TOC can be deleted/replaced; the TOC is auto-generated, auto-updated, auto-linked, and cannot be deleted (though it can be hidden from body content via Include in = None while still exporting the navigational TOC).
- **Pagination model:** page numbers begin at Body page 1 (always starts on the right). Front-matter pages *after* the TOC use **Roman numerals**; pages *before* the TOC (Title, Copyright) are **unnumbered**. Header-placement hides the number on each chapter's first page; footer placement shows numbers on all pages.
- Drag-and-drop moves pages between sections; numbering and TOC update automatically.

### 6.1 Preset page layouts (three-dots → Preset Layouts)
- Treated as chapters: **Prologue, Epilogue**.
- Simplified title-only (no first-sentence formatting): **Blurbs, Foreword, Preface, Introduction, Afterword, Acknowledgements, About the Author**.
- **Dedication** (centered text, top of page, no chapter title).
- **Epigraph** (block-quote formatted, top of page, no title).
- **Also By** (centered on page; supports cover images with links in digital).

### 6.2 Title Page
- Auto-generated from Book Details; deletable/replaceable.
- Custom title page: add a Chapter (follows theme) or a **Full Page Image**; choose image to extend **to margins** or **full bleed**; pre-size to trim.

### 6.3 Copyright Page
- Auto-added to every new/imported book as "Simple Copyright"; field placeholders for year, author/pen name.
- Advanced templates (three-dots): **General Fiction Copyright, General Nonfiction Copyright, Public Domain Copyright**; periodically added alternate templates (multiple template versions available); editable text.

### 6.4 Table of Contents
- Auto-created and internally linked (NCX/navigational list for ePub automatically coded).
- Not directly editable; per-page "Hide in Table of Contents" gear option; per-page Include In = None removes a page's visible entry; **single-volume TOC options: Show Subtitles, List Subheads**; multi-volume/boxset TOCs have extra options; custom TOC title available in Book Details ("Custom TOC Title").
- **Formatting-versioned vs content:** eBooks must have a title on every chapter and no duplicate titles for valid TOC.

### 6.5 Back matter
- Standard pages via three-dots: **Acknowledgements, About the Author, Also By**, epigraphs, blurbs, bibliography/chapters, review-request/CTA pages, End-of-Book Notes section.
- Digital-only behavior: back matter URLs are live in eBooks; links are stripped in Print PDF → QR codes or printed URLs recommended for print.

---

## 7. Boxsets, Parts, Volumes, Multi-Volume Books

- **Boxset creation:** Home dashboard → "Create a New Boxset" → choose books (click order determines reading order; numbering shown) → enter boxset details → compiled into a **single file**.
- Boxset structure: a **book-level Front Matter** (auto-generated) plus each included book's own front matter (title page, copyright, TOC per book) — toggleable. Entire boxset shares one theme; volumes/pages/chapters draggable to reorder.
- **Volumes** from a single imported multi-book .docx: select chapters (SHIFT+click range) → right-click → Create a Volume; separate Front Matter per volume; chapters can be hidden/shown per volume in the nav.
- **Parts:** subgroups within a book/volume for parts of the manuscript.
- Export: whole boxset → one PDF or ePub.

---

## 8. Formatting & Themes

### 8.1 Theme model
- A theme = the book's master style guide (chapter headings, paragraphs, subheads, scene breaks, notes, print layout, typography, header/footer, trim).
- **17 preset themes**; themes are organized into a carousel/gallery with favorites ("Heart" pin), preview thumbnails that instantly show font/size/line-spacing/margins/chapter-title options, and arrows to navigate. Custom themes are editable, **duplicatable**, renamable, deletable; "Edit as New Theme" from any preset; "Save as New Theme" to persist a design (unsaved-leave warning).
- Custom theme builder covers: chapter heading elements, subheadings, body/paragraph settings, scene breaks, notes, images, print settings, typography, header/footer, trim size.

### 8.2 Chapter heading settings
- Toggle elements: **Chapter Number, Chapter Title, Chapter Subtitle** with independent fonts/sizes/styles/alignment; auto chapter numbering (Body "Numbered" master setting + per-chapter override).
- **Chapter header image:** same image every chapter OR per-chapter individual images; Image Element placement relative to number/title/subtitle; size/alignment controls.
- **Background image:** full-page bleed behind content (print). In eBooks, background images only render in the chapter-heading portion (readers don't render behind text). Adjustable **opacity**; **light text** option for dark images.
- **Chapter title/heading size:** can be reduced per page ("Use Smaller Chapter Title"); option to set a smaller heading font size.
- Heading styles H2–H6 customizable; relative default sizes H2=1.2× → H6=1.07× body.

### 8.3 Paragraph / body settings
- **First-sentence formatting:** **Drop Caps** and/or **Lead-in Small Caps**; apply at chapter start only, or also after each scene break; per-chapter hide override. First sentence (and text after scene breaks) not indented when indented-paragraph style used.
- Indent vs. **space-between-paragraphs**; custom indent setting; hanging indent blocks; custom "keep" settings.
- **Drop caps:** "unique drop caps" (custom drop cap design selections, March 2026) per roadmap.
- Body text alignment (justified etc.) and hyphenation options (print only).

### 8.4 Subheadings H2–H6
- Multiple heading levels, selectable via toolbar dropdown; individually styleable in theme; importable from Word Heading 2–6; "keep" options so subheads stay with following paragraph.

### 8.5 Scene breaks
- Styles: **with image** (ornamental), **without image** (extra-large space), or **no visible break**.
- Ornamental break library (built-in options) **plus user uploads**; width-percentage selector; image sizing; keep-with-next option; import of `***` as placeholder with one-click conversion to ornament applied book-wide.

### 8.6 Notes settings (see Section 10)
### 8.7 Typography / fonts
- **Body fonts (print/digital):** curated set of 15: Benne, Cardo, Crimson Pro, EB Garamond, Libre Baskerville, Libre Caslon, Lora, Open Sans, OpenDyslexic, PT Sans, Rosario, Source Sans Pro, Spectral, Theano Didot, Young Serif. (Earlier versions advertised "26 fonts"; current is this curated list + Google Fonts for headings.)
- **Headings/subheadings fonts:** the reference product presets **plus the Google Fonts Library (1,500+ fonts, currently Beta)** via a Font Gallery with Favorites/Library tabs, search, and type filters (sans-serif, serif, handwriting, display, monospace). Favorite a font to add it to theme dropdowns.
- Body font size, line spacing, and font family universal; per-element styles for headings; font-style options (bold/italic, weights) in custom themes.
- **Large Print setting** — one toggle auto-configures font, font size, line spacing, and ragged-right alignment to international large-print accessibility standards.
- No user font uploads yet (roadmap/licensing research).

### 8.8 Print settings
- **Margins** (inside/gutter larger than outside; defaults are industry standard); **trim size** selection with **color-coding** showing Amazon KDP vs IngramSpark availability; popular trims for major printers.
- **Layout priority algorithm** (bottom-of-page balancing), three modes:
  1. **Widows & Orphans** (cleanest narrative flow; for novels, memoirs, short stories, poetry).
  2. **Balanced Page Spread** (layout-heavy/modular content: nonfiction, lists, callouts, images, journals/planners).
  3. **Best of Both** (hybrid the reference product algorithm, general-purpose).
- **Keep options** (keep scene-break images / subheadings with following content).
- Widow/orphan handling vs. page-balance priority toggle (older setting superseded by the three modes).

### 8.9 Header & footer
- Content: page number, book title, chapter title, author name (auto-populated from book details/chapters).
- Layout picker (preset header/footer layouts with thumbnails); font + size settings; spacing controls; additional header/footer options added June 2026.
- Rules: page number in header hidden on first page of each chapter; in footer shown everywhere unless hidden on a specific page/chapter.

### 8.10 Custom theme extras
- Image opacity; light-text option; "Invert Text Color" per chapter (for light text over dark background images when a page lacks the background).
- Theme elements can be built/reused: Chapter Heading, Paragraph, Subheading, Scene Break, Notes, Print Layout, Typography, Header/Footer, Trim Sizes.

---

## 9. Pagination, Page Layout & Blank Pages

- Body starts page 1 on the **right**; "Begin On" options (Either side / Right / Left) at Body level (book-wide) and per page/chapter; first body page is always right. Begin-on-Right auto-inserts trailing blank pages as needed.
- Manual **blank page**: add a page with Hide Chapter Heading (+ optional Hide Page Number / Hide Header & Footer / Hide in TOC).
- Manual **Page Break** within a chapter (toolbar): honored in print and flip-page eBook readers; ignored in scrolling readers; still carries header/footer.
- Unexpected blank-page causes to defend against: Begin-On a side with no content; invisible trailing spaces/newlines at chapter end.
- Separate page option for in-chapter images (print) — image forced to its own page.

---

## 10. Footnotes & Endnotes

- Three note types:
  1. **Footnotes** — bottom of the page. **Print only** (eBooks have no fixed pages). Numbering restarts each chapter.
  2. **End-of-Chapter Notes** — end of each chapter; **print + ePub**; numbering restarts per chapter.
  3. **End-of-Book Notes** — single section at book end; **print + ePub**; numbering continuous OR restarting per chapter (theme setting). Options: "Include Chapter Title" (adds chapter header to notes page), "Categorize by Title" (chapter-title subheadings on notes page), Custom Endnotes Title.
- Insert via toolbar "1" button (pop-up editor); displayed inline in the editor; final numbering applied during formatting per theme Notes Settings; note **text-size slider**; notes get stable IDs for correct ePub internal navigation (never duplicate notes via copy/paste).
- Import rules: Word Footnotes import (not endnotes — convert first); each note < 1,000 characters; no blank notes (blank/very long notes break PDF export); hyperlink URLs inside notes after import.
- Device behavior varies: some readers honor placement; others show interactive pop-ups.
- Bibliographies are ordinary chapters with hanging-indent list styling (not notes).

---

## 11. Writing Goals, Habits & Focus Tools

- **Book Goal:** total target word count + due date + committed writing days → the reference product calculates required words per writing day.
- **Writing Habit Tracker:** words-per-day target (can reference the Book Goal calc), committed days; calendar shows colored day-boxes for goals met; day icon changes from snowflake → flame when the daily goal is hit; tracks percentages, current streak, longest streak, and past months' daily counts.
- **Sprint Timer:** timed writing session + break interval between sprints (e.g., 50 min write / 10 min break).
- **Writing Preferences** (Editor Settings): personal font/font size/line-height/paragraph indent-vs-space/justify. Per-account, not shared, display-only.

---

## 12. Images & Media

### 12.1 In-chapter images
- Insert via picture icon (browse or drag-drop); per-image settings: **Caption** (always italic), **Alignment** (left/right/center), **Wrap Text** (text wraps around left/right aligned images), **Separate Page** (print), **Size** (shrink only, proportional; no crop/enlarge in app — pre-size externally), **Link** (external URL or internal link).
- Reopen settings via gear icon. Can't be full-bleed within a chapter (only Full Page Image objects can).

### 12.2 Full-page images
- Insertable between any pages/chapters (three-dots → Full Page Image).
- Can extend **to margins** or **full bleed** (print; KDP bleed = 0.125″ beyond trim top/bottom/outer).
- In eBooks (no bleed) full-page images auto-fit to device screen within device margins.
- Option to **replace the Title Page with a full-page image**.

### 12.3 Two-page spreads
- Planned/in progress: dedicated two-page image spread (roadmap "In progress"); related guidance exists for image sizing across spreads.

### 12.4 Image source & handling
- Imports must be **.jpg or .png**.
- **Auto image compression** on all new imports (incl. full-page and custom-theme images); compressed for low delivery fees; tuned so Amazon can compress further.
- Recommended: keep images out of the .docx for import; insert during formatting.
- **Alt text / accessibility:** alt text fields on inline images, full-page images, and per-chapter header images; **not** needed/supported for scene breaks, CSS background header images, shared book-wide header images, publisher logo, or cover. Accessibility-targeted feature (June 2025). Under 140 chars guidance (Amazon max); ACE-checker aware.
- Image management: image **folders/organization** (Aug 2026); delete previously uploaded theme images.

### 12.5 Image-size tooling
- On-site/companion **image-size calculators** consider trim, bleed, margins:
  - Full-bleed single page: Width = Trim W + 0.125″; Height = Trim H + 0.25″; px = in × PPI (300 for print).
  - In-chapter (fit within margins): Width = Trim W − (Inside + Outside margin); px = in × PPI.
- Cover-size references: KDP Kindle eBook cover 2,560×1,600 px; Apple Books 2,400×1,600 px (or ~4M px total). Print cover (with spine/back) is created externally, not in the reference product.

---

## 13. Previewing

- Preview panel available from the **Writing editor** (bottom-right Preview icon) and in the **Formatting tab** (right-side previewer).
- **Device previews:** a digital reading-device selector approximates real devices (homepage lists iPhone, iPad, Galaxy S21, Kindle Fire, Paperwhite, Kindle Oasis, Nook Glowlight 3, Kobo Forma) + **Print**.
- **Print preview is "true to export":** renders every formatting change; shows **total page count** beneath (includes all front-matter pages — used for cover design; separate from in-book page numbering). Clicking the print preview opens that chapter as a **PDF in a new tab**.
- Preview font selector changes only the preview (eReaders let readers choose fonts); export is fully reflowable except chapter headers.
- Links are **live/clickable in preview**; can proof-test hyperlinks.
- **ePub reading behaviors:** page-break elements honored in flip-page readers, ignored in scroll-mode readers.
- Chapter navigation buttons below the previewer; theme carousel arrows.
- Rendering modes added Jun 2026: **ePub page flip, draft mode, full book view**; roadmap completed "immersive realistic virtual book previewer."

---

## 14. Export & Publishing

### 14.1 Export formats
- **ePub** (digital — Kindle/Kobo/Nook/Apple Books/Google Play/tolino/etc.), **PDF** (print-ready), **DOCX** (backup/editing/share). **MOBI is not exported** (Amazon dropped MOBI; convert ePub→mobi via free Kindle Previewer for sideloading/ARCs).
- ePub export runs in the browser; must allow pop-ups. PDF export renders the book then signals ready ("green light") to download.
- Export buttons: under the Previewer in the Formatting tab; also at the bottom of Writing-tab Book Details.
- ePub includes the auto-coded NCX/navigational TOC and internal links; export validated (epub validation protections/error diagnostics; roadmap: "Export Failure Diagnostics System").
- ePub metadata identifies the reference product (BookFunnel-compatible).

### 14.2 Publishing-market compatibility
- Exports are publish-ready for: Amazon KDP, Barnes & Noble, Apple Books, Kobo, Draft2Digital, Smashwords, tolino, Scribd, OverDrive/Libby, Google Play, and more. Trim-size color-coding supports KDP vs IngramSpark print checks.
- Proofing guidance: Kindle Previewer (ePub), Adobe Acrobat Two-Page View (print), KDP Print Previewer (Amazon), physical author copies.

### 14.3 Version-specific output
- One source book can export both eBook and Print; or **duplicate** the book to create format-specific versions (e.g., separate eBook with lower-PPI images to cut delivery costs; separate print-optimized version).
- Per-page **Include In (All / eBook Only / Print Only / None)** for format-specific content.
- eBook images lower resolution (smaller file/delivery fees); print images 300 PPI.
- Start-page setting for ePub ("start page").
- Print costs reducible via theme choices (notes end-of-book vs end-of-chapter, font family, trim within KDP Standard, margins/font-size/line-spacing nudges). Companion **Amazon royalty/print-cost calculator** on the site.

### 14.4 Known export constraints (to design around)
- No export without a book title. Browser caching can break exports (fix via incognito/hard refresh).
- Chapters > ~8,000 words can break rendering (split-chapter workflow). Oversized images break PDF render (resize to 50%/20%). Foreign pasted code breaks exports. Blank or >1,000-word notes break PDF export. Unsupported symbols/emoji/accented characters can break exports with certain fonts.

---

## 15. Collaboration (Owner, Co-Writer, Editor, Beta Reader)

- Invite collaborators on any open book: top menu **Invite** → email + role → send. Non-users are prompted to purchase; users get in-app notifications (top-right). **Owner** = the account that started/uploaded the book; owners keep full control incl. formatting, access, deletion; collaborator books appear in the user's **Collaboration Tab**.
- **Roles & permissions:**
  - **Owner:** everything — write, format, export, delete book, invite/remove collaborators.
  - **Co-Writer:** author-level text editing. May add chapters (Copyright templates, Preset Layouts, Title Page, Chapter, Full Page Image, Import Chapters). Sidebar: Editor Settings (not shared), Goals (not shared), Collab (comments — add/edit/delete own), Find & Replace, Preview. Toolbar: all EXCEPT Split Chapter, Page Break, Scene Break. **Cannot** delete/move chapters or add/move scenes, **no** formatting access.
  - **Editor:** content refinement via **Tracked Changes** + comments. Restricted to: tracked changes in the editor; sidebar Editor Settings (not shared), Collab (comments + tracked changes), Preview; toolbar basic text styles, subheadings, hyperlinks.
  - **Beta Reader:** feedback only — comments; confined to the Writing editor; editing/deleting own comments; no other tools.
- **Collaboration Tab** filters: All / Co-Write / Track Change Edits / Comments; remove yourself from a project via three-dots → Remove Access (immediate).
- **Managing edits (Owner):** right-side **Collab panel** shows Comments + Track Changes; dropdown **View by Type** (All / Comments / Edits) and **Filter by Status** (Resolved / Unresolved, default unresolved). Export blocked until unresolved changes resolved (pop-up prompt). Book deletion notifies collaborators.
- Editor Settings and Goals are per-account, never shared. No ownership-transfer flow documented.

---

## 16. Accessibility

- **Alt text** support & guidance (Section 12.4) for accessible eBooks; designed to meet accessibility guidelines (ACE-aware element-level rules).
- **OpenDyslexic** body font + heading option; **Large Print** auto-configuration (Section 8.7).
- Dark mode for the app UI (released Jan 2026).
- Roadmap: "Enhanced Accessibility."

---

## 17. Integrations & Ecosystem

- **Booklinker** — universal book links (bridge page) created inline from links.
- **Book Brush** — (integration for marketing graphics; roadmap/announced).
- **ProWritingAid** — integration announced/completed on roadmap (grammar/style).
- **Kindle Previewer** / **Adobe Acrobat** / **KDP Print Previewer** — external proofing (not in-app integrations, but documented workflow).
- Companion calculators: image-size calculator and Amazon royalty/print-cost calculator.
- External hyperlink, QR-code generation (Kindlepreneur) used for print.
- Support & community: in-app support button, intercom Help Center, tutorials, YouTube channel, Facebook community.

---

## 18. Feature Flags / Capability Checklist (homepage "Why Choose the reference product")

Cross-platform (Win/Mac/Linux/Chromebook) • Export EPUB, PDF, DOCX • Import DOCX • 17+ chapter themes • 1,500+ fonts • full-bleed images • custom chapter theme builder • volumes and parts • large print (all features) • footnotes • H2–H6 headings • version control (roadmap: coming soon) • callout boxes • cloud storage & backups • boxsets • drag-and-drop chapters • book goals & writing-habit tracker • word counter • scenes • footnotes/endnotes • smart quotes • find & replace • master pages/templates • page breaks • collaboration • drop caps • text messages • call-out boxes • accessibility (alt text) • dark mode.

---

## 19. Changelog Highlights (feature history — useful for parity check)

New features by release (from the product changelog):
- 2026: image folders; extra header/footer options; extra copyright templates; ePub page-flip/draft mode/full-book view rendering; unique/custom drop caps; dark mode.
- 2025: alt text/accessibility; import & caching, PDF reliability & security, sync/load-time and stability improvements; copy/paste protections.
- 2024: **collaboration** (roles/invites/manage edits); search/sort books by title, author, project, version; UI overhaul.
- 2023: footnotes/endnote import from docx; **Text Messaging**; **Call-Out Boxes** with advanced customization; browser ePub export; footnote/endnote enhancements; hanging-indent + custom-indent blocks; **H2–H6 multi-level subheadings**; **Boxsets, Volumes, Parts, Scenes, Chapter-level settings**; theme-builder revamp; scene-break options; replace title page with full-page image; "Best of Both" layout; block-quote attribution; orphan/widow-vs-balance prioritization.
- 2022: **Find & Replace**; **Booklinker** universal links; page breaks; image separate-page option; keep-options for subheads/breaks; font-style options; duplicate custom theme; **social media profiles**; version naming/sorting; smart-quote algorithm + consistency notifications; drag-drop docx into open book; PDF previewer/generation upgrade (exact preview, headers/footers, page count, direct download, full-page background w/ white text); **Book Brush integration**.
- 2021: **sprint timer**; writing-habit goals; writing preferences (font/size/line-height/paragraphs/justify); start-page for ePub; book-level goals; **reusable templates**; subheads in TOC; OpenDyslexic; ornamental-break width selector; **large print config**; all body-chapter options; internal linking; image compression; image options (width%, wrap, linkable); account backup button + auto backup on logout; **.docx export, .rtf import, ePub import**; body text options (small caps/monospace/sans); undo/redo; full-page-image chapter type + custom chapter type + error-notification popup; Include-in / Begin-on options; word counter (book/chapter/selection); split chapter; export buttons under previewer; chapter-navigation buttons.

---

## 20. Official Roadmap Status (public Notion board, captured Sep 2026)

**In progress:** multiple fonts in a single chapter; two-page image spreads; journal-writer tools (lines, duplication); flexible chapter-heading gaps; forced page edges (full-bleed edges control).

**In the queue:** book & boxset organization system (folders); enhanced accessibility; new genre formatting; tables in ePub files; user-created TOCs.

**Recently completed (parity reference):** image folder organization • speed improvements • realistic virtual book previewer • export-failure diagnostics • custom drop-cap designs • dark mode • alt text • .docx import guide • collaboration • 1,000+ additional fonts • callout boxes • text messages • footnote formatting • boxsets/parts/scenes • theme creation revamp • chapter-level settings • TOC improvements • block quote attribution • best-of-both page layout • find & replace • keep options • improved page balancing • universal book links • additional copyright templates • page breaks • footnotes • end-of-book notes • duplicate theme • social media profiles • drag-drop docx • smart quotes • ProWritingAid integration • paginated previewer • Book Brush integration • ePub start page • reusable templates • writing font options • book-level goal tracking • body-chapter options • internal links • large print • custom theme builder • image compression • full-bleed images • chapter header images • duplicate book • rtf import • auto-https links • .docx export • backup-all button • quick snapshot • small caps/sans/mono • support button • sans-serif body fonts • undo/redo • full-page image • custom chapter type • title page theming • export error message • export/chapter buttons under previewer • disable auto title/copyright/TOC • word counts • TOC in previewer • +6 themes • drop-caps/first-paragraph theming • split chapter • custom ornamental break • cross-platform • multi-device previewer • .docx importing • epub/print formatting • customizable themes • word processor • offline • autosave • footnotes/endnotes • spell check • header/footer options • ornamental break library • print font selection.

---

## 21. Pricing & Business Model (context for the new app)

- One-time **$147** (eBook and Print; no monthly fees, forever). 30-day money-back guarantee.
- Marketing claims to replicate if desired: works online/offline, you own your data with safe cloud backup, automatic saving, unlimited books & pen names, cross-device access via browser login.
- Comparisons used: Vellum $249 (Mac only), fewer chapter themes/fonts, lacks cloud backup/custom theme builder etc.
