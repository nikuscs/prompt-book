import { useCallback, useEffect, useRef } from "react";
import { Check, ChevronDown, Copy, EllipsisVertical, Trash2 } from "lucide-react";

import { PromptCardMenu } from "@/components/prompt-card-menu";
import { getPromptPreview, hasSelectedText } from "@/components/prompt-card-utils";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Textarea } from "@/components/ui/textarea";
import { usePromptStoreContext } from "@/contexts/prompt-store-context";
import { usePromptCardMenu } from "@/hooks/use-prompt-card-menu";
import { UNNAMED_PROMPT_TITLE } from "@/lib/constants";
import type { Prompt } from "@/types/prompt";

export function PromptCardMain({ prompt }: { prompt: Prompt }) {
  const store = usePromptStoreContext();
  const { menuOpen, menuRef, toggleMenu, closeMenu } = usePromptCardMenu();
  const cardRef = useRef<HTMLDivElement>(null);
  const titleEditableRef = useRef<HTMLSpanElement>(null);

  const isExpanded = prompt.id === store.expandedId;
  const isCopied = store.copiedId === prompt.id;
  const isDeleteConfirm = store.deleteConfirmId === prompt.id;
  const isEditingTitle = store.editingTitleId === prompt.id;
  const focusToken = store.focusPromptRequest?.promptId === prompt.id ? store.focusPromptRequest.token : undefined;

  const handleCopy = () => store.copyPrompt(prompt);

  const commitTitleEdit = useCallback(() => {
    const value = titleEditableRef.current?.textContent?.trim() || UNNAMED_PROMPT_TITLE;
    store.commitTitle(prompt.id, value);
  }, [store, prompt.id]);

  useEffect(() => {
    if (!isExpanded || focusToken == null) return;
    const frame = window.requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      const textarea = cardRef.current?.querySelector("textarea");
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus();
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusToken, isExpanded]);

  useEffect(() => {
    if (!isEditingTitle || !titleEditableRef.current) return;
    const onPointerDown = (event: PointerEvent) => {
      if (titleEditableRef.current?.contains(event.target as Node)) return;
      commitTitleEdit();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [commitTitleEdit, isEditingTitle]);

  useEffect(() => {
    if (!isEditingTitle) return;
    const onBeforeSave = (event: Event) => {
      const custom = event as CustomEvent<{ handled?: boolean }>;
      commitTitleEdit();
      if (custom.detail) custom.detail.handled = true;
    };
    window.addEventListener("promptbook:before-save", onBeforeSave);
    return () => window.removeEventListener("promptbook:before-save", onBeforeSave);
  }, [commitTitleEdit, isEditingTitle]);

  const handleCopyShortcut = (event: React.KeyboardEvent) => {
    if (!((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c")) return;
    if (hasSelectedText(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    handleCopy();
  };

  return (
    <div ref={cardRef} className="rounded-lg border border-border bg-card" onKeyDownCapture={handleCopyShortcut}>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5">
        <Button size="icon-xs" variant="ghost" className="size-6 rounded-sm text-muted-foreground" onClick={() => store.toggleExpanded(prompt.id)}>
          <ChevronDown className={`size-3.5 text-muted-foreground transition ${isExpanded ? "rotate-180" : ""}`} />
        </Button>
        <div
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
          role="button"
          tabIndex={0}
          onClick={(event) => {
            if (event.detail > 1 || isEditingTitle) return;
            store.toggleExpanded(prompt.id);
          }}
          onKeyDown={(event) => {
            if (isEditingTitle) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              store.toggleExpanded(prompt.id);
            }
          }}
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            store.startEditTitle(prompt);
          }}
        >
          {isEditingTitle ? (
            <span
              ref={titleEditableRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              className="inline-block min-w-10 shrink-0 whitespace-nowrap px-1 text-[12px] font-medium cursor-text caret-current outline-none"
              onBlur={commitTitleEdit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitTitleEdit();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  store.cancelEditTitle();
                }
              }}
            >
              {store.editingTitleValue}
            </span>
          ) : (
            <span className="shrink-0 whitespace-nowrap px-1 text-[12px] font-medium">{prompt.title || UNNAMED_PROMPT_TITLE}</span>
          )}
          <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{getPromptPreview(prompt.content)}</span>
        </div>
        <div className="relative" ref={menuRef}>
          <ButtonGroup className="gap-0.5 p-0.5">
            <Button
              size="xs"
              variant={isCopied ? "secondary" : "ghost"}
              className={isCopied ? "border-success/45 bg-success/12 text-success hover:bg-success/18" : ""}
              onClick={handleCopy}
            >
              {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {isCopied ? "Copied" : "Copy"}
            </Button>
            <Button
              size="xs"
              variant={isDeleteConfirm ? "secondary" : "ghost"}
              className={isDeleteConfirm ? "text-destructive" : "text-muted-foreground hover:text-foreground"}
              onClick={(event) => {
                event.stopPropagation();
                if (isDeleteConfirm) {
                  store.deletePrompt(prompt.id);
                  return;
                }
                store.requestDeleteConfirm(prompt.id);
              }}
            >
              <Trash2 className="size-3.5" />
              {isDeleteConfirm ? "Sure?" : null}
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              className="size-6 rounded-sm"
              onClick={(event) => {
                event.stopPropagation();
                toggleMenu();
              }}
              title="More actions"
            >
              <EllipsisVertical className="size-3.5" />
            </Button>
          </ButtonGroup>
          <PromptCardMenu
            open={menuOpen}
            onOpenInEditor={(editor) => {
              store.openInEditor(prompt, editor);
              closeMenu();
            }}
            onCopyPath={() => {
              store.copyPath(prompt);
              closeMenu();
            }}
          />
        </div>
      </div>
      {isExpanded ? (
        <div className="border-t border-border px-2.5 pb-2.5 pt-2">
          <Textarea
            className="min-h-[140px] resize-y font-mono text-[13px]"
            value={prompt.content}
            onChange={(event) => store.changeContent(prompt.id, event.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
