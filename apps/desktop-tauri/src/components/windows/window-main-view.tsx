import type { RefObject } from "react";

import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { PromptList } from "@/components/prompt-list";
import { SearchBar } from "@/components/search-bar";
import { ScrollAreaVanilla } from "@/components/ui/scroll-area-vanilla";
import { APP_COPYRIGHT, APP_SHORTCUTS, WINDOW_MAIN_LIST_MAX_HEIGHT } from "@/lib/constants";
import type { Prompt } from "@/types/prompt";

type WindowMainViewProps = {
  prompts: Prompt[];
  search: string;
  selectedId: string;
  expandedId: string;
  copiedId: string | null;
  deleteConfirmId: string | null;
  editingTitleId: string | null;
  editingTitleValue: string;
  focusPromptRequest: { promptId: string; token: number } | null;
  contentRef: RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onAddPrompt: () => void;
  onStartDrag: () => void;
  onSelectPrompt: (promptId: string) => void;
  onTogglePrompt: (promptId: string) => void;
  onStartEditPrompt: (prompt: Prompt) => void;
  onCommitPromptTitle: (promptId: string, value: string) => void;
  onCancelEditPrompt: () => void;
  onCopyPrompt: (prompt: Prompt) => void;
  onOpenPromptInEditor: (prompt: Prompt, editor: "cursor" | "vscode" | "zed") => void;
  onCopyPromptPath: (prompt: Prompt) => void;
  onRequestDeleteConfirm: (promptId: string) => void;
  onDeletePrompt: (promptId: string) => void;
  onChangePromptContent: (promptId: string, value: string) => void;
};

export function WindowMainView({
  prompts,
  search,
  selectedId,
  expandedId,
  copiedId,
  deleteConfirmId,
  editingTitleId,
  editingTitleValue,
  focusPromptRequest,
  contentRef,
  onSearchChange,
  onAddPrompt,
  onStartDrag,
  onSelectPrompt,
  onTogglePrompt,
  onStartEditPrompt,
  onCommitPromptTitle,
  onCancelEditPrompt,
  onCopyPrompt,
  onOpenPromptInEditor,
  onCopyPromptPath,
  onRequestDeleteConfirm,
  onDeletePrompt,
  onChangePromptContent,
}: WindowMainViewProps) {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background px-4 pb-2 pt-11 text-foreground">
      <div className="absolute left-28 right-0 top-0 h-10" data-tauri-drag-region onMouseDown={onStartDrag} />
      <div ref={contentRef} className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 flex items-center gap-2 pb-2">
          <SearchBar value={search} onChange={onSearchChange} onAdd={onAddPrompt} className="flex-1" />
        </div>
        <ScrollAreaVanilla className="min-h-0 flex-1" viewportClassName="p-0 pr-1 pb-1" style={{ maxHeight: `${WINDOW_MAIN_LIST_MAX_HEIGHT}px` }} showScrollIndicators>
          <PromptList
            prompts={prompts}
            variant="main"
            selectedId={selectedId}
            expandedId={expandedId}
            copiedId={copiedId}
            deleteConfirmId={deleteConfirmId}
            editingTitleId={editingTitleId}
            editingTitleValue={editingTitleValue}
            focusPromptRequest={focusPromptRequest}
            onSelect={onSelectPrompt}
            onToggle={onTogglePrompt}
            onStartEdit={onStartEditPrompt}
            onCommitTitle={onCommitPromptTitle}
            onCancelEdit={onCancelEditPrompt}
            onCopy={onCopyPrompt}
            onOpenInEditor={onOpenPromptInEditor}
            onCopyPath={onCopyPromptPath}
            onRequestDeleteConfirm={onRequestDeleteConfirm}
            onDelete={onDeletePrompt}
            onContentChange={onChangePromptContent}
          />
        </ScrollAreaVanilla>
        <div className="shrink-0 pt-0.5">
          <KeyboardShortcuts shortcuts={APP_SHORTCUTS} className="min-h-3.5" />
          <p className="pt-0.5 text-center text-[7px] tracking-[0.08em] text-muted-foreground/45">{APP_COPYRIGHT}</p>
        </div>
      </div>
    </main>
  );
}
