import { Pencil } from "lucide-react";

import { IconCopyPath, IconCursor, IconVscode, IconZed } from "@/components/icons";

type PromptCardMenuProps = {
  open: boolean;
  onEdit?: () => void;
  onOpenInEditor: (editor: "cursor" | "vscode" | "zed") => void;
  onCopyPath: () => void;
};

export function PromptCardMenu({ open, onEdit, onOpenInEditor, onCopyPath }: PromptCardMenuProps) {
  if (!open) return null;

  const itemClass = "flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-xs hover:bg-accent";

  return (
    <div className="absolute right-0 z-30 mt-1.5 w-44 rounded-md border border-input bg-popover p-1 shadow-lg">
      {onEdit ? (
        <button className={itemClass} onClick={onEdit}>
          <Pencil className="size-3.5" />
          <span className="truncate whitespace-nowrap">Edit</span>
        </button>
      ) : null}
      <button className={itemClass} onClick={() => onOpenInEditor("cursor")}>
        <IconCursor className="size-3.5" />
        <span className="truncate whitespace-nowrap">Open in Cursor</span>
      </button>
      <button className={itemClass} onClick={() => onOpenInEditor("vscode")}>
        <IconVscode className="size-3.5" />
        <span className="truncate whitespace-nowrap">Open in VS Code</span>
      </button>
      <button className={itemClass} onClick={() => onOpenInEditor("zed")}>
        <IconZed className="size-3.5" />
        <span className="truncate whitespace-nowrap">Open in Zed</span>
      </button>
      <button className={itemClass} onClick={onCopyPath}>
        <IconCopyPath className="size-3.5" />
        <span className="truncate whitespace-nowrap">Copy Path</span>
      </button>
    </div>
  );
}
