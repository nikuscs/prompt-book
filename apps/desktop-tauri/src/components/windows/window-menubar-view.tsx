import { ExternalLink } from "lucide-react";
import type { RefObject } from "react";

import { PromptList } from "@/components/prompt-list";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { ScrollAreaVanilla } from "@/components/ui/scroll-area-vanilla";
import { APP_NAME_MARK } from "@/lib/constants";
import type { Prompt } from "@/types/prompt";

type WindowMenubarViewProps = {
  prompts: Prompt[];
  selectedId: string;
  copiedId: string | null;
  search: string;
  listHeight: number;
  contentRef: RefObject<HTMLDivElement | null>;
  headerRef: RefObject<HTMLDivElement | null>;
  listInnerRef: RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onAddPrompt: () => void;
  onOpenMainWindow: () => void;
  onSelectPrompt: (promptId: string) => void;
  onCopyPrompt: (prompt: Prompt) => void;
  onEditPrompt: (prompt: Prompt) => void;
  onOpenPromptInEditor: (prompt: Prompt, editor: "cursor" | "vscode" | "zed") => void;
  onCopyPromptPath: (prompt: Prompt) => void;
};

export function WindowMenubarView({
  prompts,
  selectedId,
  copiedId,
  search,
  listHeight,
  contentRef,
  headerRef,
  listInnerRef,
  onSearchChange,
  onAddPrompt,
  onOpenMainWindow,
  onSelectPrompt,
  onCopyPrompt,
  onEditPrompt,
  onOpenPromptInEditor,
  onCopyPromptPath,
}: WindowMenubarViewProps) {
  return (
    <main className="h-screen w-screen overflow-hidden bg-transparent text-foreground">
      <div className="flex h-full w-full flex-col items-center bg-transparent p-3 pt-1.5">
        <div className="tray-arrow z-20 translate-y-1" />
        <div
          ref={contentRef}
          className="relative mt-1 flex min-h-0 w-full flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-lg select-none"
        >
          <div ref={headerRef} className="px-3 pb-2 pt-1.5">
            <div className="flex items-center justify-between gap-2 pb-2">
              <div className="text-[8px] tracking-[0.1em] text-muted-foreground/70" data-tauri-drag-region>
                {APP_NAME_MARK}
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                className="size-5 rounded-sm p-0"
                onClick={onOpenMainWindow}
                title="Open full window"
                tabIndex={-1}
              >
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
            <SearchBar autoFocus value={search} onChange={onSearchChange} onAdd={onAddPrompt} className="flex-1" />
          </div>
          <div className="px-3 pb-2.5 pt-0">
            <ScrollAreaVanilla className="min-h-0" viewportClassName="p-0 pr-1 pb-1" showScrollIndicators style={{ height: `${listHeight}px` }}>
              <div ref={listInnerRef}>
                <PromptList
                  prompts={prompts}
                  variant="menubar"
                  selectedId={selectedId}
                  copiedId={copiedId}
                  onSelect={onSelectPrompt}
                  onCopy={onCopyPrompt}
                  onEdit={onEditPrompt}
                  onOpenInEditor={onOpenPromptInEditor}
                  onCopyPath={onCopyPromptPath}
                />
              </div>
            </ScrollAreaVanilla>
          </div>
        </div>
      </div>
    </main>
  );
}
