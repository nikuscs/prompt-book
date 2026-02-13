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

export function KeyboardShortcuts({ shortcuts, className }: KeyboardShortcutsProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-md border border-border/45 bg-card/55 px-2.5 py-1">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.label} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/78">
            <span className="text-[9px] font-medium tracking-[0.12em]">{shortcut.label}</span>
            <span className="inline-flex items-center gap-1">
              {shortcut.keys.map((key) => (
                <Kbd key={`${shortcut.label}-${key}`}>{key}</Kbd>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
