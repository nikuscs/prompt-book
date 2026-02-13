import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type KbdProps = ComponentProps<"kbd">;

export function Kbd({ className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-[5px] border border-border/70 bg-background/90 px-1.5 font-mono text-[9px] leading-none text-muted-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]",
        className,
      )}
      {...props}
    />
  );
}
