import { Check, Copy, EllipsisVertical, GripVertical } from "lucide-react";

import { PromptCardMenu } from "@/components/prompt-card-menu";
import { getPromptPreview, hasSelectedText } from "@/components/prompt-card-utils";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { usePromptStoreContext } from "@/contexts/prompt-store-context";
import { usePromptCardMenu } from "@/hooks/use-prompt-card-menu";
import { UNNAMED_PROMPT_TITLE } from "@/lib/constants";
import type { DragHandleProps } from "@/types/drag";
import type { Prompt } from "@/types/prompt";

export function PromptCardMenubar({ prompt, dragHandle }: { prompt: Prompt; dragHandle?: DragHandleProps }) {
  const { selectedId, copiedId, deleteConfirmId, selectPrompt, copyPrompt, requestDeleteConfirm, deletePrompt, openInEditor, copyPath, editInMainWindow } = usePromptStoreContext();
  const { menuOpen, menuRef, portalRef, toggleMenu, closeMenu } = usePromptCardMenu();

  const selected = prompt.id === selectedId;
  const isCopied = copiedId === prompt.id;
  const isDeleteConfirm = deleteConfirmId === prompt.id;

  const handleCopy = () => copyPrompt(prompt);

  const handleCopyShortcut = (event: React.KeyboardEvent) => {
    if (!((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c")) return;
    if (hasSelectedText(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    handleCopy();
  };

  return (
    <div
      className={`group w-full rounded-lg border px-2 py-1.5 transition ${
        selected ? "border-border bg-secondary" : "border-transparent bg-transparent hover:border-border hover:bg-secondary"
      }`}
      onKeyDownCapture={handleCopyShortcut}
    >
      <div className="flex items-center gap-1">
        {dragHandle ? (
          <div
            ref={dragHandle.ref}
            {...dragHandle.listeners}
            className="flex shrink-0 cursor-grab items-center touch-none active:cursor-grabbing"
          >
            <GripVertical className="size-3 text-muted-foreground/40" />
          </div>
        ) : null}
        <button className="min-w-0 flex-1 text-left" onClick={() => selectPrompt(prompt.id)}>
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 whitespace-nowrap text-[11px] font-medium">{prompt.title || UNNAMED_PROMPT_TITLE}</span>
            <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">{getPromptPreview(prompt.content)}</span>
          </div>
        </button>
        <div className="relative" ref={menuRef}>
          <ButtonGroup className="gap-0.5 p-0.5">
            <Button
              size="xs"
              variant={isCopied ? "secondary" : "ghost"}
              className={
                isCopied
                  ? "h-5 border-success/45 bg-success/12 px-1.5 text-[10px] text-success hover:bg-success/18"
                  : "h-5 px-1.5 text-[10px]"
              }
              onClick={handleCopy}
            >
              {isCopied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
              {isCopied ? "Copied" : "Copy"}
            </Button>
            <Button size="icon-xs" variant="ghost" className="size-5 rounded-sm" onClick={toggleMenu} title="More actions">
              <EllipsisVertical className="size-3" />
            </Button>
          </ButtonGroup>
          <PromptCardMenu
            open={menuOpen}
            triggerRef={menuRef}
            portalRef={portalRef}
            onOpenInEditor={(editor) => {
              openInEditor(prompt, editor);
              closeMenu();
            }}
            onCopyPath={() => {
              copyPath(prompt);
              closeMenu();
            }}
            onEdit={() => {
              editInMainWindow(prompt);
              closeMenu();
            }}
            deleteConfirm={isDeleteConfirm}
            onDelete={() => {
              if (isDeleteConfirm) {
                deletePrompt(prompt.id);
                closeMenu();
              } else {
                requestDeleteConfirm(prompt.id);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
