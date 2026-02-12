# PromptBook Monorepo

Desktop rewrite in progress using:
- Tauri v2
- React + Vite
- shadcn/ui
- Bun workspaces + Turborepo

## Workspace
- App: `/Users/jon/projects/prompt-book/apps/desktop-tauri`
- Legacy SwiftUI backup: `/Users/jon/projects/prompt-book/backup/swiftui-legacy`

## Install
From repo root:

```bash
bun install
```

## Run / Test
From repo root:

### Frontend build only (fast, no Rust compile)
```bash
bun run desktop:build
```

### Tauri dev (normal)
```bash
bun run tauri:dev
```

### Tauri dev (low CPU mode)
```bash
bun run tauri:dev:lowcpu
```

## HMR
Yes, HMR is enabled for the React frontend while running `tauri dev`.
- UI/TS/CSS changes: hot reload via Vite.
- Rust (`src-tauri`) changes: require recompilation/restart.

## Root scripts
- `bun run dev`
- `bun run build`
- `bun run lint`
- `bun run typecheck`
- `bun run desktop:build`
- `bun run tauri:dev`
- `bun run tauri:dev:lowcpu`
