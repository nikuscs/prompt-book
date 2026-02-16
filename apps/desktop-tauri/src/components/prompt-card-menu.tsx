import { type RefObject, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2 } from "lucide-react";

import { IconCopyPath, IconCursor, IconVscode, IconZed } from "@/components/icons";

type PromptCardMenuProps = {
  open: boolean;
  triggerRef: RefObject<HTMLDivElement | null>;
  portalRef: RefObject<HTMLDivElement | null>;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteConfirm?: boolean;
  onOpenInEditor: (editor: "cursor" | "vscode" | "zed") => void;
  onCopyPath: () => void;
};

export function PromptCardMenu({ open, triggerRef, portalRef, onEdit, onDelete, deleteConfirm, onOpenInEditor, onCopyPath }: PromptCardMenuProps) {
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!open || !triggerRef.current || !el) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuHeight = el.offsetHeight;
    const menuWidth = el.offsetWidth;
    const spaceBelow = window.innerHeight - triggerRect.bottom;

    const top = spaceBelow >= menuHeight + 6
      ? triggerRect.bottom + 6
      : triggerRect.top - menuHeight - 6;
    const left = Math.max(4, triggerRect.right - menuWidth);

    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    el.style.visibility = "visible";
  }, [open, triggerRef]);

  if (!open) return null;

  const itemClass = "flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-xs hover:bg-accent";

  return createPortal(
    <div
      ref={(node) => {
        innerRef.current = node;
        if (typeof portalRef === "object" && portalRef) portalRef.current = node;
      }}
      className="fixed z-30 w-44 rounded-md border border-input bg-popover p-1 shadow-lg"
      style={{ visibility: "hidden" }}
    >
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
      {onDelete ? (
        <button className={`${itemClass} text-destructive hover:text-destructive`} onClick={onDelete}>
          <Trash2 className="size-3.5" />
          <span className="truncate whitespace-nowrap">{deleteConfirm ? "Sure? Delete" : "Delete"}</span>
        </button>
      ) : null}
    </div>,
    document.body,
  );
}
