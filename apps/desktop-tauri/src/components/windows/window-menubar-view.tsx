import { invoke } from "@tauri-apps/api/core";
import { ExternalLink } from "lucide-react";
import { type RefObject, useEffect } from "react";

import { hasSelectedText } from "@/components/prompt-card-utils";
import { PromptList } from "@/components/prompt-list";
import { PromptListEmptyMenubar } from "@/components/prompt-list-empty";
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
  const { search, setSearch, addPrompt, filteredPrompts, selectedId, copyPrompt } = usePromptStoreContext();
  const isEmpty = filteredPrompts.length === 0;

  const addAndOpen = () => {
    const id = addPrompt();
    void invoke("open_main_window_for_prompt", { promptId: id });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isInput = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;

      if ((event.metaKey || event.ctrlKey) && key === "c") {
        if (hasSelectedText(event.target)) return;
        const prompt = filteredPrompts.find((p) => p.id === selectedId);
        if (!prompt) return;
        event.preventDefault();
        copyPrompt(prompt);
        return;
      }

      if (key === "e" && !event.metaKey && !event.ctrlKey && !event.altKey && !isInput) {
        const prompt = filteredPrompts.find((p) => p.id === selectedId);
        if (!prompt) return;
        event.preventDefault();
        void invoke("open_main_window_for_prompt", { promptId: prompt.id });
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [filteredPrompts, selectedId, copyPrompt]);

  return (
    <main className="h-screen w-screen overflow-hidden bg-transparent text-foreground">
      <div className="flex h-full w-full flex-col items-center bg-transparent p-3 pt-1.5">
        <div className="tray-arrow z-20 translate-y-1" />
        <div
          ref={contentRef}
          className="relative mt-1 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-lg select-none"
        >
          <div ref={headerRef} className="shrink-0 px-3 pb-2 pt-3">
            <SearchBar autoFocus value={search} onChange={setSearch} onAdd={addAndOpen} className="flex-1" />
          </div>
          {isEmpty ? (
            <div className="flex min-h-0 flex-1 px-3 pb-2.5 pt-0">
              <PromptListEmptyMenubar />
            </div>
          ) : (
            <div className="min-h-0 flex-1 px-3 pb-2.5 pt-0">
              <ScrollAreaVanilla className="h-full min-h-0" viewportClassName="p-0 pr-1 pb-1">
                <div ref={listInnerRef}>
                  <PromptList variant="menubar" />
                </div>
              </ScrollAreaVanilla>
            </div>
          )}
          <div className="shrink-0 flex items-center justify-between px-3 pb-2 pt-0.5">
            <div className="text-[7px] tracking-[0.1em] text-muted-foreground/45">
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
              <ExternalLink className="size-3 text-muted-foreground/60" />
            </Button>
          </div>
        </div>
      </div>
      <SaveToast visible={saveToastVisible} className="bottom-1.5" />
    </main>
  );
}
