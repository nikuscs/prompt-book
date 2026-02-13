import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

type Shortcut = {
  label: string;
  keys: readonly string[];
};

type KeyboardShortcutsProps = {
  shortcuts: readonly Shortcut[];
  className?: string;
};

function formatKey(key: string): string {
  switch (key.toUpperCase()) {
    case "CMD":
    case "META":
      return "⌘";
    case "SHIFT":
      return "⇧";
    case "ALT":
    case "OPTION":
      return "⌥";
    case "CTRL":
    case "CONTROL":
      return "⌃";
    case "ENTER":
      return "↩";
    default:
      return key.toUpperCase();
  }
}

export function KeyboardShortcuts({ shortcuts, className }: KeyboardShortcutsProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="inline-flex flex-wrap items-center justify-center gap-1">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.label} className="group relative inline-flex items-center" title={shortcut.label}>
            <span
              className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-border/45 bg-background/85 px-1.5 py-0.5 text-[8px] font-medium tracking-[0.08em] text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-opacity duration-150 group-hover:opacity-100"
              role="tooltip"
            >
              {shortcut.label}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[8px] text-muted-foreground/72">
              {shortcut.keys.map((key, index) => (
                <span key={`${shortcut.label}-${key}`} className="inline-flex items-center gap-0.5">
                  {index > 0 ? <span className="text-[8px] text-muted-foreground/55">+</span> : null}
                  <Kbd className="h-3.5 min-w-3.5 rounded-[4px] px-1 text-[8px]">{formatKey(key)}</Kbd>
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
