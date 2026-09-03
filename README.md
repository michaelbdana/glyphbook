# Glyphbook

An offline, desktop book-writing and book-formatting application. Write a manuscript, organize it into front matter / body / back matter with chapters, scenes, parts and volumes, apply a theme, preview it on phones and e-readers, and export **print PDF**, **ePub**, and **DOCX** — all from a single source file, with no login and no cloud.

- One-time local install (Windows, macOS, Linux)
- Fully offline: your books live on your computer (`library.json` + timed snapshots)
- the reference product-style three-screen workflow: **My Books → Writing → Formatting**

## Documentation

| Document | Contents |
|---|---|
| [`feature-reference.md`](feature-reference.md) | Compiled feature spec this app is built from |
| [`DESIGN.md`](DESIGN.md) | Architecture, tech stack, and milestone log |
| [`UI_UX.md`](UI_UX.md) | Interface specification (the reference product-similar) |
| [`docs/conformance.md`](docs/conformance.md) | Feature coverage map and known parity gaps |

## Tech stack

Electron 44 + TypeScript (strict) + React + Tailwind CSS v4 + TipTap/ProseMirror + Zustand. Print rendering uses paged.js + Chromium `printToPDF`; ePub is generated in-process (JSZip); DOCX via the `docx` package; Word import via mammoth.

## Requirements

- Node.js 18+ (developed on 22) and npm
- ~700 MB free disk for the first install (Electron binary)

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

## Feature overview

- Writing editor with chapters/scenes, H2–H6, callout-free typographic marks (bold, italic, mono, small caps, sans), scene breaks, and inline images
- Front/back matter preset pages (Title, Copyright, TOC, Dedication, Epigraph, About the Author, etc.), Parts & Volumes, per-chapter options (Include In, Begin On, hide toggles)
- Theme system with preset themes, a custom theme builder, trim sizes, large print, and a theme→print CSS compiler
- Tools: find & replace, smart quotes, book goals, writing-habit streak, sprint timer, editor display preferences, spell check
- Device previews (Kindle/Nook/Kobo/phone/tablet) and a print preview
- Exports: publish-ready print PDF and ePub, plus DOCX for sharing/backup
- .docx manuscript import with auto chapter detection
