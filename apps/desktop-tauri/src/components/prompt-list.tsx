import type { Prompt } from "@/types/prompt";
import { PromptCard } from "@/components/prompt-card";

type PromptListProps = {
  prompts: Prompt[];
  variant: "main" | "menubar";
  selectedId?: string;
  expandedId?: string;
  copiedId?: string | null;
  deleteConfirmId?: string | null;
  editingTitleId?: string | null;
  editingTitleValue?: string;
  onSelect?: (promptId: string) => void;
  onToggle?: (promptId: string) => void;
  onStartEdit?: (prompt: Prompt) => void;
  onCommitTitle?: (promptId: string, value: string) => void;
  onCancelEdit?: () => void;
  onCopy: (prompt: Prompt) => void;
  onCopyPath: (prompt: Prompt) => void;
  onOpenInEditor: (prompt: Prompt, editor: "cursor" | "vscode" | "zed") => void;
  onRequestDeleteConfirm?: (promptId: string) => void;
  onDelete?: (promptId: string) => void;
  onContentChange?: (promptId: string, value: string) => void;
};

export function PromptList({
  prompts,
  variant,
  selectedId = "",
  expandedId = "",
  copiedId = null,
  deleteConfirmId = null,
  editingTitleId = null,
  editingTitleValue = "",
  onSelect,
  onToggle,
  onStartEdit,
  onCommitTitle,
  onCancelEdit,
  onCopy,
  onCopyPath,
  onOpenInEditor,
  onRequestDeleteConfirm,
  onDelete,
  onContentChange,
}: PromptListProps) {
  return (
    <div className="space-y-1.5">
      {prompts.map((prompt) => {
        const isSelected = prompt.id === selectedId;
        const isExpanded = prompt.id === expandedId;
        const isCopied = copiedId === prompt.id;
        const isDeleteConfirm = deleteConfirmId === prompt.id;
        const isEditingTitle = editingTitleId === prompt.id;

        return (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            variant={variant}
            selected={isSelected}
            isExpanded={isExpanded}
            isCopied={isCopied}
            isDeleteConfirm={isDeleteConfirm}
            editingTitle={isEditingTitle}
            editingTitleValue={editingTitleValue}
            onSelect={() => onSelect?.(prompt.id)}
            onToggle={() => onToggle?.(prompt.id)}
            onStartEdit={() => onStartEdit?.(prompt)}
            onCommitTitle={(value) => onCommitTitle?.(prompt.id, value)}
            onCancelEdit={onCancelEdit}
            onCopy={() => onCopy(prompt)}
            onCopyPath={() => onCopyPath(prompt)}
            onOpenInEditor={(editor) => onOpenInEditor(prompt, editor)}
            onRequestDeleteConfirm={() => onRequestDeleteConfirm?.(prompt.id)}
            onDelete={() => onDelete?.(prompt.id)}
            onContentChange={(value) => onContentChange?.(prompt.id, value)}
          />
        );
      })}
    </div>
  );
}
