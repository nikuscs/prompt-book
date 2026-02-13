# Prompt Storage + Sync Plan

Created: 2026-02-13

## Goals
- Replace `localStorage` with durable app storage in config dir.
- Keep UX fast (autosave, Cmd/Ctrl+S).
- Prepare clean architecture for future GitHub sync (repo + gist).
- Prevent data loss and resolve conflicts predictably.

## Current State
- Prompts are stored in browser `localStorage` (`promptbook.prompts.v1`).
- Main window close hides the window (does not destroy it), but storage is still webview-scoped.

## Target Architecture
- Source of truth: filesystem in app config dir.
- Runtime flow:
  1. Frontend edits prompt state.
  2. Debounced autosave triggers Tauri command.
  3. Rust persists to disk atomically.
  4. Frontend shows save status (`Saving`, `Saved`, `Error`).
- Sync layer (later): background + on-demand push/pull against GitHub repo/gist.

## Phase 1: Local Filesystem Storage (next task)
### 1. Storage location
- Base path: OS config dir + app namespace.
- Example macOS: `~/Library/Application Support/com.promptbook.app/`
- Keep storage under:
  - `prompts/` (individual markdown files)
  - `index.json` (metadata/order)
  - `state.json` (optional UI state: expanded IDs, selection)

### 2. Data model
- `index.json` contains:
  - prompt IDs
  - title
  - file name/path
  - createdAt/updatedAt
  - ordering
- Prompt content stored in `prompts/<id>.md`.
- Optional frontmatter in markdown for metadata (future-proof).

### 3. Tauri commands
- `load_prompts() -> Prompt[]`
- `save_prompt(id, title, content)`
- `create_prompt(initial_title)`
- `delete_prompt(id)`
- `reorder_prompts(ids[])`
- `save_all(prompts[])` (bulk fallback / migration path)

### 4. Write safety
- Atomic writes: write temp file then rename.
- Use simple per-write lock/mutex in Rust to avoid concurrent corruption.
- Validate IDs/filenames; never trust raw path input.

### 5. Frontend migration
- On app boot:
  - call `load_prompts`
  - if disk empty and `localStorage` has legacy data, import once
  - clear legacy key after confirmed successful import
- Continue debounced autosave + Cmd/Ctrl+S, but through Tauri commands.

### 6. UX details
- Save status indicator in header:
  - `Saving...` during write
  - `Saved` with timestamp on success
  - `Save failed` with retry action on error

## Phase 2: GitHub Sync Foundation
### 1. Sync providers
- `GitHubRepoProvider`
- `GitHubGistProvider`
- common trait/interface:
  - `pull()`
  - `push()`
  - `status()`
  - `resolve_conflict()`

### 2. Auth
- GitHub token stored in OS keychain (Tauri plugin store only for non-secret settings).
- Scope minimization (`gist` for gist mode, repo scope for repo mode).

### 3. Sync strategy
- Local-first.
- Explicit sync button + optional interval sync.
- Store last sync metadata (`lastSyncAt`, `remoteRevision`, `localRevision`).

### 4. Conflict policy (initial)
- If remote changed since last pull and local changed:
  - create conflict copy locally
  - keep local as active
  - show conflict banner with actions

## Phase 3: Nice-to-have
- Export/import zip/json.
- Prompt version history.
- Per-prompt tags and folders.
- Optional encryption-at-rest.

## Implementation Order (recommended)
1. Rust filesystem layer + commands.
2. Frontend wiring to commands.
3. Migration from `localStorage`.
4. Save status UX.
5. Sync provider scaffolding (no network writes yet).
6. GitHub gist sync.
7. GitHub repo sync.

## Open Questions
- File format preference for long term: pure markdown + frontmatter vs JSON + markdown body?
- Should we keep one file per prompt permanently, or support single bundle file mode?
- Should autosave debounce differ between title edits and content edits?
