# Refactor Plan: Tauri + Electron Research (2026-02-12)

## What I changed right now
- Created branch: `codex/refactor-tauri-electron`
- Moved current SwiftUI app into backup:
  - `backup/swiftui-legacy/PromptBook`
  - `backup/swiftui-legacy/PromptBook.xcodeproj`
  - `backup/swiftui-legacy/PromptBookTests`
  - `backup/swiftui-legacy/plan.md`

## Latest versions (verified today)
- Tauri CLI (`@tauri-apps/cli`): `2.9.2`
  - Source: https://www.npmjs.com/package/%40tauri-apps/cli
- Electron (`electron`): `40.4.0`
  - Source: https://www.npmjs.com/package/electron

## Official docs for menu bar / tray behavior
- Tauri v2 Tray icon docs:
  - https://v2.tauri.app/reference/javascript/api/namespacetray/
- Tauri v2 Positioner plugin (critical for tray popover positioning):
  - https://v2.tauri.app/plugin/positioner/
- Tauri v2 opener plugin (open links/files from tray app):
  - https://v2.tauri.app/plugin/opener/
- Electron Tray docs:
  - https://www.electronjs.org/docs/latest/api/tray
- Electron BrowserWindow docs:
  - https://www.electronjs.org/docs/latest/api/browser-window

## Good repositories to inspect (menu/tray style)
- Tauri app examples org:
  - https://github.com/tauri-apps/tauri-apps
- Tauri plugin workspace/examples:
  - https://github.com/tauri-apps/plugins-workspace
- Electron official examples:
  - https://github.com/electron/electron-quick-start
  - https://github.com/electron/electron-api-demos

## Recommendation for this project
- Primary: **Tauri v2** for production app.
  - Better memory footprint and startup for tray-first utility apps.
  - Native-feeling tray integration + plugin ecosystem for window positioning.
- Secondary: keep a tiny Electron prototype only if we hit a Tauri blocker.

## Proposed new structure
- `apps/desktop-tauri/` (main product)
- `apps/desktop-electron-spike/` (optional short-lived comparison spike)
- `backup/swiftui-legacy/` (already done)

## Suggested execution order
1. Scaffold Tauri v2 app in `apps/desktop-tauri`.
2. Implement tray icon + click-to-copy menu with ranking.
3. Implement main searchable window and edit flow.
4. Add local DB (SQLite) and migrations.
5. Add global shortcut + launch at login.
6. Only if needed, create Electron spike and benchmark startup/RAM.

## Notes
- For tray popovers on macOS in Tauri, using the positioner plugin is usually the cleanest approach.
- For your UX (hover pencil, copy on click, open edit window), Tauri’s tray + main window split maps well.
