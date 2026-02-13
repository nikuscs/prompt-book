# PromptBook

![CI](https://github.com/nikuscs/prompt-book/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/nikuscs/prompt-book/actions/workflows/release.yml/badge.svg)

Fast macOS menu-bar prompt library built with Tauri v2 + React.

PromptBook is a native-feeling desktop app to store, search, edit, and instantly copy prompts from a compact menu-bar popover, with a full editor window when needed.

## Features

- Menu-bar popover for quick search + copy
- Full editor window with inline editing
- Autosave for title/content
- Prompt files stored on disk (source of truth)
- Compact COSS/shadcn-compatible UI system
- Keyboard shortcuts support (including `Cmd+S`)
- Rust + TypeScript strict lint/typecheck setup
- GitHub Actions CI + release workflow

## Tech Stack

- Tauri v2 (Rust backend)
- React 19 + Vite
- Tailwind CSS v4
- Bun workspaces + Turborepo
- oxlint + TypeScript strict mode + Clippy + rustfmt

## Project Structure

- `/Users/jon/projects/prompt-book/apps/desktop-tauri`: Desktop app (frontend + Tauri)
- `/Users/jon/projects/prompt-book/.github/workflows`: CI/CD workflows

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
