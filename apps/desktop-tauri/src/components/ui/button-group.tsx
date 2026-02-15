import type * as React from "react";

import { cn } from "@/lib/utils";

type ButtonGroupProps = React.HTMLAttributes<HTMLDivElement>;

export function ButtonGroup({ className, ...props }: ButtonGroupProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-input bg-input/28 p-1 shadow-xs/5",
        className,
      )}
      data-slot="button-group"
      role="group"
      {...props}
    />
  );
}
