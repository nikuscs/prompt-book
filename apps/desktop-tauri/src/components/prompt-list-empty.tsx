import { invoke } from "@tauri-apps/api/core";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePromptStoreContext } from "@/contexts/prompt-store-context";
import logoUrl from "@/assets/logo.png";

export function PromptListEmptyMain() {
  const { search, addPrompt } = usePromptStoreContext();

  if (search.trim()) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-xs text-muted-foreground">No prompts found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16">
      <img
        src={logoUrl}
        alt=""
        className="size-24 opacity-[0.15] grayscale dark:opacity-[0.10]"
        draggable={false}
      />
      <div className="text-center">
        <p className="text-xs text-muted-foreground">No prompts yet</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground/60">
          Create your first prompt to get started
        </p>
      </div>
      <Button size="sm" variant="outline" className="mt-1 gap-1.5" onClick={addPrompt}>
        <Plus className="size-3.5" />
        New Prompt
      </Button>
    </div>
  );
}

export function PromptListEmptyMenubar() {
  const { search, addPrompt } = usePromptStoreContext();

  if (search.trim()) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-muted-foreground">No prompts found</p>
      </div>
    );
  }

  const addAndOpen = () => {
    const id = addPrompt();
    void invoke("open_main_window_for_prompt", { promptId: id });
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
      <img
        src={logoUrl}
        alt=""
        className="size-20 opacity-[0.15] grayscale dark:opacity-[0.10]"
        draggable={false}
      />
      <div className="text-center">
        <p className="text-[11px] text-muted-foreground">No prompts yet</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/60">
          Create your first prompt to get started
        </p>
      </div>
      <Button size="xs" variant="outline" className="gap-1" onClick={addAndOpen}>
        <Plus className="size-3" />
        New Prompt
      </Button>
    </div>
  );
}
