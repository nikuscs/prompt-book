import { ExternalLink } from "lucide-react";
import type { RefObject } from "react";

import { PromptList } from "@/components/prompt-list";
import { SaveToast } from "@/components/save-toast";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { ScrollAreaVanilla } from "@/components/ui/scroll-area-vanilla";
import { usePromptStoreContext } from "@/contexts/prompt-store-context";
import { APP_NAME_MARK } from "@/lib/constants";

type WindowMenubarViewProps = {
  saveToastVisible: boolean;
  contentRef: RefObject<HTMLDivElement | null>;
  headerRef: RefObject<HTMLDivElement | null>;
  listInnerRef: RefObject<HTMLDivElement | null>;
  onOpenMainWindow: () => void;
};

export function WindowMenubarView({
  saveToastVisible,
  contentRef,
  headerRef,
  listInnerRef,
  onOpenMainWindow,
}: WindowMenubarViewProps) {
  const { search, setSearch, addPrompt } = usePromptStoreContext();

  return (
    <main className="h-screen w-screen overflow-hidden bg-transparent text-foreground">
      <div className="flex h-full w-full flex-col items-center bg-transparent p-3 pt-1.5">
        <div className="tray-arrow z-20 translate-y-1" />
        <div
          ref={contentRef}
          className="relative mt-1 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-lg select-none"
        >
          <div ref={headerRef} className="shrink-0 px-3 pb-2 pt-1.5">
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
            <SearchBar autoFocus value={search} onChange={setSearch} onAdd={addPrompt} className="flex-1" />
          </div>
          <div className="min-h-0 flex-1 px-3 pb-2.5 pt-0">
            <ScrollAreaVanilla className="h-full min-h-0" viewportClassName="p-0 pr-1 pb-1" showScrollIndicators>
              <div ref={listInnerRef}>
                <PromptList variant="menubar" />
              </div>
            </ScrollAreaVanilla>
          </div>
        </div>
      </div>
      <SaveToast visible={saveToastVisible} className="bottom-1.5" />
    </main>
  );
}
