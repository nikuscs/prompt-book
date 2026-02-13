import { Check, Copy, EllipsisVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

type PromptCardActionsProps = {
  variant: "main" | "menubar";
  isCopied: boolean;
  isDeleteConfirm?: boolean;
  onCopy: () => void;
  onToggleMenu: () => void;
  onDelete?: () => void;
  onRequestDeleteConfirm?: () => void;
};

export function PromptCardActions({
  variant,
  isCopied,
  isDeleteConfirm = false,
  onCopy,
  onToggleMenu,
  onDelete,
  onRequestDeleteConfirm,
}: PromptCardActionsProps) {
  if (variant === "menubar") {
    return (
      <ButtonGroup className="gap-0.5 p-0.5">
        <Button
          size="xs"
          variant={isCopied ? "secondary" : "ghost"}
          className={
            isCopied
              ? "h-5 border-success/45 bg-success/12 px-1.5 text-[10px] text-success hover:bg-success/18"
              : "h-5 px-1.5 text-[10px]"
          }
          onClick={onCopy}
        >
          {isCopied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
          {isCopied ? "Copied" : "Copy"}
        </Button>
        <Button size="icon-xs" variant="ghost" className="size-5 rounded-sm" onClick={onToggleMenu} title="More actions">
          <EllipsisVertical className="size-3" />
        </Button>
      </ButtonGroup>
    );
  }

  return (
    <ButtonGroup className="gap-0.5 p-0.5">
      <Button
        size="xs"
        variant={isCopied ? "secondary" : "ghost"}
        className={isCopied ? "border-success/45 bg-success/12 text-success hover:bg-success/18" : ""}
        onClick={onCopy}
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
            onDelete?.();
            return;
          }
          onRequestDeleteConfirm?.();
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
          onToggleMenu();
        }}
        title="More actions"
      >
        <EllipsisVertical className="size-3.5" />
      </Button>
    </ButtonGroup>
  );
}
