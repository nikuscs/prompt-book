import type { RefObject } from "react";

import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { PromptList } from "@/components/prompt-list";
import { SaveToast } from "@/components/save-toast";
import { SearchBar } from "@/components/search-bar";
import { ScrollAreaVanilla } from "@/components/ui/scroll-area-vanilla";
import { usePromptStoreContext } from "@/contexts/prompt-store-context";
import { APP_COPYRIGHT, APP_SHORTCUTS, WINDOW_MAIN_LIST_MAX_HEIGHT } from "@/lib/constants";

type WindowMainViewProps = {
  saveToastVisible: boolean;
  contentRef: RefObject<HTMLDivElement | null>;
  onStartDrag: () => void;
};

export function WindowMainView({ saveToastVisible, contentRef, onStartDrag }: WindowMainViewProps) {
  const { search, setSearch, addPrompt } = usePromptStoreContext();

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background px-4 pb-2 pt-11 text-foreground">
      <div className="absolute left-28 right-0 top-0 h-10" data-tauri-drag-region onMouseDown={onStartDrag} />
      <div ref={contentRef} className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 flex items-center gap-2 pb-2">
          <SearchBar value={search} onChange={setSearch} onAdd={addPrompt} className="flex-1" />
        </div>
        <ScrollAreaVanilla
          className="min-h-0 flex-1"
          viewportClassName="p-0 pr-1 pb-1"
          style={{ maxHeight: `${WINDOW_MAIN_LIST_MAX_HEIGHT}px` }}
          showScrollIndicators
        >
          <PromptList variant="main" />
        </ScrollAreaVanilla>
        <div className="shrink-0 pt-0.5">
          <KeyboardShortcuts shortcuts={APP_SHORTCUTS} className="min-h-3.5" />
          <p className="pt-0.5 text-center text-[7px] tracking-[0.08em] text-muted-foreground/45">{APP_COPYRIGHT}</p>
        </div>
      </div>
      <SaveToast visible={saveToastVisible} />
    </main>
  );
}
