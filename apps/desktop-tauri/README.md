# PromptBook Desktop (Tauri)

Desktop app package for PromptBook.

## Run

```bash
bun install
bun run tauri dev
```

## Validate

```bash
bun run check
```

## Icons

Regenerate app icons from the source file:

```bash
cd apps/desktop-tauri
./node_modules/.bin/tauri icon ./icon.icon/Assets/logo.png
```

This generates all platform icons (icns, ico, PNGs) into `src-tauri/icons/` from the 1024x1024 source PNG.

## Build

```bash
bun run build
bun run tauri build
```

## Stack

- Tauri v2
- React 19 + Vite
- Tailwind CSS v4
- Rust + TypeScript strict checks
