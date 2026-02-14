# Promptbook ® 📖

[![CI](https://img.shields.io/github/actions/workflow/status/nikuscs/prompt-book/ci.yml?branch=main&label=CI)](https://github.com/nikuscs/prompt-book/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/nikuscs/prompt-book?label=Release)](https://github.com/nikuscs/prompt-book/releases/latest)

Fast macOS menu-bar prompt library built with Tauri v2 + React.

PromptBook is a native-feeling desktop app to store, search, edit, and instantly copy prompts from a compact menu-bar popover, with a full editor window when needed.

## Download

**[Download latest release](https://github.com/nikuscs/prompt-book/releases/latest)** (macOS, Apple Silicon)

After installing, macOS may block the app since it's not notarized. Run this in Terminal to fix it:

```bash
xattr -cr /Applications/PromptBook.app
```

## Features

- ⚡ Menu-bar popover for quick search + copy
- 🧩 Full editor window with inline editing
- 💾 Autosave for title/content
- 🗂️ Prompt files stored on disk (source of truth)
- 🎨 Compact COSS/shadcn-compatible UI system
- ⌨️ Keyboard shortcuts support (including `Cmd+S`)
- 🛡️ Rust + TypeScript strict lint/typecheck setup
- 🚀 GitHub Actions CI + release workflow

## Tech Stack

- Tauri v2 (Rust backend)
- React 19 + Vite
- Tailwind CSS v4
- Bun workspaces + Turborepo
- oxlint + TypeScript strict mode + Clippy + rustfmt

## FAQ

### How do I install PromptBook?

Download the latest `.dmg` from [GitHub Releases](https://github.com/nikuscs/prompt-book/releases), open it, and drag PromptBook to your Applications folder.

### macOS says the app is "damaged and should be moved to the Trash"

PromptBook is not notarized with Apple, so macOS quarantines it on download. Run this in Terminal to fix it:

```bash
xattr -cr /Applications/PromptBook.app
```

If you see "cannot be opened" instead, go to **System Settings → Privacy & Security** and click **Open Anyway**.

### Where are my prompts saved?

Prompts are stored as markdown files in `~/.config/promptbook/`. Each prompt is a separate `.md` file with an `index.json` for ordering and metadata.

### What keyboard shortcuts are available?

| Shortcut | Action |
|----------|--------|
| `Cmd+S` | Save prompt |
| `Cmd+C` | Copy prompt (when not editing) |
| `E` | Open prompt in editor (menu bar) |

## Quick Start

```bash
bun install
bun run tauri:dev
```

## Scripts

### Root

```bash
bun run dev
bun run build
bun run lint
bun run typecheck
bun run check
bun run tauri:dev
bun run tauri:dev:lowcpu
```

### Desktop App

```bash
cd apps/desktop-tauri
bun run dev
bun run build
bun run check
bun run tauri dev
```

## Storage

Prompt files are saved under:

```text
~/.config/promptbook/
```

Current storage model:

- One markdown file per prompt (`kebab-case-title.md`)
- `index.json` for ordering + metadata
- Files are the canonical source of truth

## Quality Gates

`bun run check` runs:

- TypeScript lint (`oxlint`)
- TypeScript typecheck
- Rust clippy
- Rust format check

## CI/CD

- CI workflow on pushes/PRs to `main`
- Release workflow (manual) with semantic bump (`patch`/`minor`/`major`)
- macOS build + release artifacts

## Disclaimer

This project is developed with AI assistance and may still contain bugs.
Use at your own risk and validate before production-critical use.
