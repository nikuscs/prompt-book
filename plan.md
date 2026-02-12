# PromptBook Implementation Plan

## Progress Snapshot

- [x] Plan created and aligned with product goals
- [x] Initial scaffold implemented
- [x] Migrated from Swift Package app to native Xcode project app target
- [x] Main window prototype with search + edit flow
- [x] Menu bar prototype with top prompts + copy-on-click + hover edit action
- [x] Local in-memory model/store for fast iteration
- [x] SwiftData persistence (replace in-memory store)
- [x] Prompt delete flow and UX polish
- [x] Ranking service extraction + recency boost
- [x] macOS global shortcut (optional/toggle)
- [x] Tests (unit + smoke)
- [x] iOS/universal target

## Project Decisions (Confirmed)

- App name: `PromptBook`
- Platform targets: latest stable Apple platforms and toolchain
- Storage: local-only first (no sync in v1)
- Prompt format: Markdown
- Ranking for menu bar: combined `copyCount + searchCount` (weighted)
- Global quick-open shortcut: included if low-risk in v1
- Visual direction: minimal, modern, slick; use latest OS materials/transparency effects
- Project format: native Xcode app project (`PromptBook.xcodeproj`)

## Product Scope (v1)

### Core Features

1. Create, edit, and delete prompts.
2. Prompt fields:
   - `title` (required)
   - `content` (Markdown, required)
3. Main app window for:
   - Search across titles + content
   - Browse and edit prompts
4. Menu bar app on macOS:
   - Show top prompts by popularity (copy + search)
   - Click a prompt to copy Markdown content instantly
   - Show pencil icon on hover to edit that prompt in main window
5. Basic usage analytics:
   - Increment search usage and copy usage counters
   - Track recency to improve ranking quality

### Non-Goals (v1)

- Cloud sync / collaboration
- Prompt variables/templating engine
- Web export/import tooling
- AI generation features

## Technical Architecture

## App Structure (Current vs Target)

- Current:
  - Native Xcode macOS app target in `PromptBook.xcodeproj`
  - SwiftUI app lifecycle
  - `MenuBarExtra` and main window scenes
- Target:
  - Add iOS target with shared domain + feature modules
  - Keep macOS menu bar scene as macOS-only

## Data Layer

- Current: in-memory `PromptStore` for prototype iteration.
- Target: migrate to `SwiftData` local persistence.
- Main model:
  - `Prompt`
    - `id: UUID`
    - `title: String`
    - `contentMarkdown: String`
    - `createdAt: Date`
    - `updatedAt: Date`
    - `copyCount: Int`
    - `searchHitCount: Int`
    - `lastCopiedAt: Date?`
    - `lastMatchedSearchAt: Date?`

## Services

- `PromptStore`:
  - CRUD abstraction over SwiftData
  - search query execution
- `PromptRankingService`:
  - calculates menu ordering from counters + recency
  - supports configurable weights for copy/search
- `ClipboardService` (platform-specific):
  - macOS: `NSPasteboard`
  - iOS: `UIPasteboard`
- `WindowRoutingService` (macOS):
  - opens/focuses main window and selects prompt for edit

## UI/UX Plan

## Design System

- Native-first SwiftUI style with modern materials.
- Use semantic tokens:
  - background surfaces (`.ultraThinMaterial` / `.regularMaterial`)
  - text hierarchy and spacing scale
  - corner radii and elevation layers
- Keep visual language restrained:
  - high contrast typography
  - clean spacing
  - subtle motion for hover/focus states

## Main Window (macOS + iOS)

1. Search field pinned at top.
2. Prompt list with:
   - title
   - content preview (first lines)
   - copy action
   - edit action
3. Add/edit sheet or detail panel with Markdown editor.
4. Keyboard shortcuts on macOS:
   - `Cmd+N` new prompt
   - `Cmd+F` focus search
   - `Enter` copy selected prompt

## Menu Bar (macOS)

1. Top area:
   - “Top Prompts” section
   - ranked list of prompts
2. Row behavior:
   - click row => copy content immediately
   - hover reveals pencil icon
   - pencil click => open main window with prompt in edit mode
3. Utility actions:
   - Open PromptBook
   - Add Prompt
   - Settings
   - Quit

## Global Shortcut (macOS)

- Implement as optional v1.1 within this phase if stable:
  - open/focus main window
  - focus search box on launch
- If reliability issues appear, keep behind settings toggle and defer default enablement.

## Ranking Formula (Initial)

Use weighted score with mild recency lift:

- `score = (copyCount * 0.7) + (searchHitCount * 0.3) + recencyBoost`
- `recencyBoost`: small additive bonus for recent copies/search matches

This can be tuned after real usage data.

## Delivery Phases

## Phase 0: Repository Setup

Status: **Partially complete**

- [x] Native Xcode macOS app project created (`PromptBook.xcodeproj`)
- [x] App runs as standard app target (not `swift run` package-only)
- [x] Base source files organized under `PromptBook/`
- [ ] Introduce feature/module folder split (`Core`, `Features`, `Tests`)
- [ ] Add lint/format config

## Phase 1: Core Data + CRUD

Status: **In progress**

- [x] `Prompt` domain model created
- [x] Add/edit flows in main window
- [x] Markdown content editing flow
- [x] Delete flow
- [x] SwiftData migration
- [ ] Unit tests for store operations

## Phase 2: Search + Ranking

Status: **In progress**

- [x] Local search in window
- [x] Search/copy counters tracked
- [x] Basic weighted ranking in store
- [x] Extract dedicated ranking service
- [x] Add recency boost
- [x] Ranking tests

## Phase 3: macOS Menu Bar

Status: **Mostly complete (prototype)**

- [x] `MenuBarExtra` scene
- [x] Top prompts list rendering
- [x] Instant copy on row click
- [x] Hover edit affordance
- [x] Open/focus main window for editing
- [ ] UX hardening and keyboard support in menu

## Phase 4: Visual Polish

Status: **Not started**

- [ ] Apply final materials/transparency pass (re-introduce safely after stability)
- [ ] Refine typography/spacing/motion
- [ ] Tune responsive layouts (macOS + iOS target)

## Phase 5: Stability + QA

Status: **Not started**

- [x] Unit tests: ranking/copy/search metrics
- [ ] Manual QA pass for menu bar and window routing
- [ ] Add iOS QA matrix after iOS target exists
- [ ] Resolve environment/debugger issues cleanly

## Acceptance Criteria (v1)

1. User can create/edit/delete markdown prompts in main window.
2. User can search prompts in main window.
3. macOS menu bar shows top prompts by copy+search ranking.
4. Clicking a menu prompt copies its markdown instantly.
5. Hovering a menu row reveals pencil icon that opens edit mode in main window.
6. App runs as native SwiftUI app with latest stable targets.

## Risks and Mitigations

1. `MenuBarExtra` interaction edge cases:
   - Mitigation: keep row action simple; isolate edit action tap target.
2. Global shortcut reliability:
   - Mitigation: add settings toggle; ship disabled by default if unstable.
3. Search quality for markdown-heavy content:
   - Mitigation: title weighting + markdown-stripped indexing in service layer.

## Next Step

1. Validate `PromptBookiOS` on a machine with the iOS platform components installed in Xcode.
2. Continue visual polish pass (materials, typography, motion).
3. Add menu keyboard UX hardening and shortcuts.
4. Add first unit tests for ranking/search/copy.
