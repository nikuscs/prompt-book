import { Check, ChevronDown, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type Prompt = {
  id: string
  title: string
  content: string
}

type PromptCardProps = {
  prompt: Prompt
  variant: "main" | "menubar"
  selected?: boolean
  isExpanded?: boolean
  isCopied?: boolean
  isDeleteConfirm?: boolean
  editingTitle?: boolean
  editingTitleValue?: string
  onToggle?: () => void
  onSelect?: () => void
  onStartEdit?: () => void
  onEditingTitleValueChange?: (value: string) => void
  onCommitTitle?: (value: string) => void
  onCancelEdit?: () => void
  onCopy: () => void
  onDelete?: () => void
  onRequestDeleteConfirm?: () => void
  onContentChange?: (value: string) => void
}

function getPromptPreview(content: string): string {
  return content
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim()
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
  onDelete,
  onRequestDeleteConfirm,
  onContentChange,
}: PromptCardProps) {
  if (variant === "menubar") {
    return (
      <div
        className={`group w-full rounded-lg border px-2 py-1.5 transition ${
          selected ? "border-border bg-secondary" : "border-transparent bg-transparent hover:border-border hover:bg-secondary"
        }`}
      >
        <div className="flex items-center gap-1">
          <button
            className="min-w-0 flex-1 text-left"
            onClick={onSelect}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 whitespace-nowrap text-[11px] font-medium">
                {prompt.title || "Unnamed"}
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                {getPromptPreview(prompt.content)}
              </span>
            </div>
          </button>
          <Button
            size="xs"
            variant={isCopied ? "secondary" : "outline"}
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
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5">
        <button
          className="inline-flex cursor-pointer items-center justify-center rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onToggle}
        >
          <ChevronDown className={`size-3.5 text-muted-foreground transition ${isExpanded ? "rotate-180" : ""}`} />
        </button>
        <div
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
          onClick={(e) => {
            if (e.detail > 1 || editingTitle) return
            onToggle?.()
          }}
          onDoubleClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onStartEdit?.()
          }}
        >
          {editingTitle ? (
            <span
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              className="inline-block min-w-10 max-w-[280px] whitespace-nowrap px-1 text-[12px] font-medium cursor-text caret-current outline-none"
              onBlur={(e) => onCommitTitle?.(e.currentTarget.textContent?.trim() || "Unnamed")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
                if (e.key === "Escape") {
                  e.preventDefault()
                  onCancelEdit?.()
                }
              }}
            >
              {editingTitleValue}
            </span>
          ) : (
            <span className="max-w-[280px] truncate whitespace-nowrap px-1 text-[12px] font-medium">{prompt.title || "Unnamed"}</span>
          )}
          <span className="truncate text-[11px] text-muted-foreground">{getPromptPreview(prompt.content)}</span>
        </div>
        <Button
          size="xs"
          variant={isCopied ? "secondary" : "outline"}
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
          onClick={(e) => {
            e.stopPropagation()
            if (isDeleteConfirm) {
              onDelete?.()
              return
            }
            onRequestDeleteConfirm?.()
          }}
        >
          <Trash2 className="size-3.5" />
          {isDeleteConfirm ? "Sure?" : null}
        </Button>
      </div>
      {isExpanded ? (
        <div className="border-t border-border px-2.5 pb-2.5 pt-2">
          <Textarea
            className="min-h-[140px] resize-y font-mono text-[13px]"
            value={prompt.content}
            onChange={(e) => onContentChange?.(e.target.value)}
          />
        </div>
      ) : null}
    </div>
  )
}
