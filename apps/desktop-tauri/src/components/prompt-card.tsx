import { useEffect, useRef, useState } from "react";
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
  onToggle?: () => void;
  onSelect?: () => void;
  onStartEdit?: () => void;
  onCommitTitle?: (value: string) => void;
  onCancelEdit?: () => void;
  onCopy: () => void;
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

export function PromptCard({
  prompt,
  variant,
  selected = false,
  isExpanded = false,
  isCopied = false,
  isDeleteConfirm = false,
  editingTitle = false,
  editingTitleValue = "",
  onToggle,
  onSelect,
  onStartEdit,
  onCommitTitle,
  onCancelEdit,
  onCopy,
  onOpenInEditor,
  onCopyPath,
  onDelete,
  onRequestDeleteConfirm,
  onContentChange,
}: PromptCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  const onEditorClick = (editor: "cursor" | "vscode" | "zed") => {
    onOpenInEditor?.(editor);
    setMenuOpen(false);
  };

  const onCopyPathClick = () => {
    onCopyPath?.();
    setMenuOpen(false);
  };

  if (variant === "menubar") {
    return (
      <div
        className={`group w-full rounded-lg border px-2 py-1.5 transition ${
          selected ? "border-border bg-secondary" : "border-transparent bg-transparent hover:border-border hover:bg-secondary"
        }`}
      >
        <div className="flex items-center gap-1">
          <button className="min-w-0 flex-1 text-left" onClick={onSelect}>
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 whitespace-nowrap text-[11px] font-medium">{prompt.title || UNNAMED_PROMPT_TITLE}</span>
              <span className="min-w-0 truncate whitespace-nowrap break-normal text-[10px] text-muted-foreground">{getPromptPreview(prompt.content)}</span>
            </div>
          </button>
          <div className="relative" ref={menuRef}>
            <PromptCardActions variant="menubar" isCopied={isCopied} onCopy={onCopy} onToggleMenu={() => setMenuOpen((prev) => !prev)} />
            <PromptCardMenu open={menuOpen} onOpenInEditor={onEditorClick} onCopyPath={onCopyPathClick} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5">
        <Button size="icon-xs" variant="ghost" className="size-6 rounded-sm text-muted-foreground" onClick={onToggle}>
          <ChevronDown className={`size-3.5 text-muted-foreground transition ${isExpanded ? "rotate-180" : ""}`} />
        </Button>
        <div
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
          onClick={(event) => {
            if (event.detail > 1 || editingTitle) return;
            onToggle?.();
          }}
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onStartEdit?.();
          }}
        >
          {editingTitle ? (
            <span
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              className="inline-block min-w-10 max-w-[280px] whitespace-nowrap px-1 text-[12px] font-medium cursor-text caret-current outline-none"
              onBlur={(event) => onCommitTitle?.(event.currentTarget.textContent?.trim() || UNNAMED_PROMPT_TITLE)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
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
            onDelete={onDelete}
            onRequestDeleteConfirm={onRequestDeleteConfirm}
          />
          <PromptCardMenu open={menuOpen} onOpenInEditor={onEditorClick} onCopyPath={onCopyPathClick} />
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
