import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { PromptCardActions } from "@/components/prompt-card-actions";
import { PromptCardMenu } from "@/components/prompt-card-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UNNAMED_PROMPT_TITLE } from "@/lib/constants";
import type { Prompt } from "@/types/prompt";

type PromptCardProps = {
  prompt: Prompt;
  variant: "main" | "menubar";
  selected?: boolean;
  isExpanded?: boolean;
  isCopied?: boolean;
  isDeleteConfirm?: boolean;
  editingTitle?: boolean;
  editingTitleValue?: string;
  focusToken?: number;
  onToggle?: () => void;
  onSelect?: () => void;
  onStartEdit?: () => void;
  onCommitTitle?: (value: string) => void;
  onCancelEdit?: () => void;
  onCopy: () => void;
  onEdit?: () => void;
  onOpenInEditor?: (editor: "cursor" | "vscode" | "zed") => void;
  onCopyPath?: () => void;
  onDelete?: () => void;
  onRequestDeleteConfirm?: () => void;
  onContentChange?: (value: string) => void;
};

function getPromptPreview(content: string): string {
  return content
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasSelectedText(target: EventTarget | null): boolean {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (start !== null && end !== null && start !== end) {
      return true;
    }
  }

  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString().length > 0);
}

export function PromptCard({
  prompt,
  variant,
  selected = false,
  isExpanded = false,
  isCopied = false,
  isDeleteConfirm = false,
  editingTitle = false,
  editingTitleValue = "",
  focusToken,
  onToggle,
  onSelect,
  onStartEdit,
  onCommitTitle,
  onCancelEdit,
  onCopy,
  onEdit,
  onOpenInEditor,
  onCopyPath,
  onDelete,
  onRequestDeleteConfirm,
  onContentChange,
}: PromptCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const titleEditableRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [menuOpen]);

  useEffect(() => {
    if (variant !== "main") return;
    if (!isExpanded || focusToken == null) return;
    const frame = window.requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
      const textarea = cardRef.current?.querySelector("textarea");
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      textarea.focus();
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusToken, isExpanded, variant]);

  const onEditorClick = (editor: "cursor" | "vscode" | "zed") => {
    onOpenInEditor?.(editor);
    setMenuOpen(false);
  };

  const onCopyPathClick = () => {
    onCopyPath?.();
    setMenuOpen(false);
  };

  const onEditClick = onEdit
    ? () => {
        onEdit();
        setMenuOpen(false);
      }
    : undefined;

  const commitTitleEdit = useCallback(() => {
    const value = titleEditableRef.current?.textContent?.trim() || UNNAMED_PROMPT_TITLE;
    onCommitTitle?.(value);
  }, [onCommitTitle]);

  const onCopyShortcut = (event: React.KeyboardEvent<HTMLElement>) => {
    const isCopy = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c";
    if (!isCopy) return;
    if (hasSelectedText(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    onCopy();
  };

  useEffect(() => {
    if (!editingTitle || !titleEditableRef.current) return;
    const onPointerDownCapture = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (titleEditableRef.current?.contains(target)) return;
      commitTitleEdit();
    };

    window.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => window.removeEventListener("pointerdown", onPointerDownCapture, true);
  }, [commitTitleEdit, editingTitle]);

  useEffect(() => {
    if (!editingTitle) return;
    const onBeforeSave = (event: Event) => {
      const custom = event as CustomEvent<{ handled?: boolean }>;
      commitTitleEdit();
      if (custom.detail) {
        custom.detail.handled = true;
      }
    };

    window.addEventListener("promptbook:before-save", onBeforeSave);
    return () => window.removeEventListener("promptbook:before-save", onBeforeSave);
  }, [commitTitleEdit, editingTitle]);

  if (variant === "menubar") {
    return (
      <div
        className={`group w-full rounded-lg border px-2 py-1.5 transition ${
          selected ? "border-border bg-secondary" : "border-transparent bg-transparent hover:border-border hover:bg-secondary"
        }`}
        onKeyDownCapture={onCopyShortcut}
      >
        <div className="flex items-center gap-1">
          <button className="min-w-0 flex-1 text-left" onClick={onSelect}>
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 whitespace-nowrap text-[11px] font-medium">{prompt.title || UNNAMED_PROMPT_TITLE}</span>
              <span className="min-w-0 truncate whitespace-nowrap break-normal text-[10px] text-muted-foreground">{getPromptPreview(prompt.content)}</span>
            </div>
          </button>
          <div className="relative" ref={menuRef}>
            <PromptCardActions
              variant="menubar"
              isCopied={isCopied}
              onCopy={onCopy}
              onToggleMenu={() => setMenuOpen((prev) => !prev)}
            />
            <PromptCardMenu
              open={menuOpen}
              onOpenInEditor={onEditorClick}
              onCopyPath={onCopyPathClick}
              {...(onEditClick ? { onEdit: onEditClick } : {})}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={cardRef} className="rounded-lg border border-border bg-card" onKeyDownCapture={onCopyShortcut}>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5">
        <Button size="icon-xs" variant="ghost" className="size-6 rounded-sm text-muted-foreground" onClick={onToggle}>
          <ChevronDown className={`size-3.5 text-muted-foreground transition ${isExpanded ? "rotate-180" : ""}`} />
        </Button>
        <div
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
          role="button"
          tabIndex={0}
          onClick={(event) => {
            if (event.detail > 1 || editingTitle) return;
            onToggle?.();
          }}
          onKeyDown={(event) => {
            if (editingTitle) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onToggle?.();
            }
          }}
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onStartEdit?.();
          }}
        >
          {editingTitle ? (
            <span
              ref={titleEditableRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              className="inline-block min-w-10 max-w-[280px] whitespace-nowrap px-1 text-[12px] font-medium cursor-text caret-current outline-none"
              onBlur={commitTitleEdit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitTitleEdit();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancelEdit?.();
                }
              }}
            >
              {editingTitleValue}
            </span>
          ) : (
            <span className="max-w-[280px] truncate whitespace-nowrap break-normal px-1 text-[12px] font-medium">{prompt.title || UNNAMED_PROMPT_TITLE}</span>
          )}
          <span className="min-w-0 truncate whitespace-nowrap break-normal text-[11px] text-muted-foreground">{getPromptPreview(prompt.content)}</span>
        </div>
        <div className="relative" ref={menuRef}>
          <PromptCardActions
            variant="main"
            isCopied={isCopied}
            isDeleteConfirm={isDeleteConfirm}
            onCopy={onCopy}
            onToggleMenu={() => setMenuOpen((prev) => !prev)}
            {...(onDelete ? { onDelete } : {})}
            {...(onRequestDeleteConfirm ? { onRequestDeleteConfirm } : {})}
          />
          <PromptCardMenu
            open={menuOpen}
            onOpenInEditor={onEditorClick}
            onCopyPath={onCopyPathClick}
            {...(onEditClick ? { onEdit: onEditClick } : {})}
          />
        </div>
      </div>
      {isExpanded ? (
        <div className="border-t border-border px-2.5 pb-2.5 pt-2">
          <Textarea className="min-h-[140px] resize-y font-mono text-[13px]" value={prompt.content} onChange={(event) => onContentChange?.(event.target.value)} />
        </div>
      ) : null}
    </div>
  );
}
