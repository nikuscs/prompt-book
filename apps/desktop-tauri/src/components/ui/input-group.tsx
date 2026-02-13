import type * as React from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InputGroupProps = React.ComponentProps<"div">;

function InputGroup({ className, ...props }: InputGroupProps) {
  return (
    <div
      className={cn(
        "relative inline-flex w-full items-stretch overflow-hidden rounded-lg border border-input bg-background text-foreground shadow-xs/5 transition-shadow dark:bg-input/32",
        "has-focus-visible:ring-[3px] has-focus-visible:ring-ring/24 has-focus-visible:border-ring",
        className,
      )}
      data-slot="input-group"
      {...props}
    />
  );
}

type InputGroupAddonProps = React.ComponentProps<"div"> & {
  align?: "inline-start" | "inline-end";
};

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: InputGroupAddonProps) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1 p-0.5",
        align === "inline-start" ? "order-first ps-0.5" : "order-last border-l border-input/60 pe-0.5",
        className,
      )}
      data-slot="input-group-addon"
      {...props}
    />
  );
}

function InputGroupInput({ className, size = "sm", ...props }: InputProps) {
  return (
    <Input
      unstyled
      size={size}
      className={cn(
        "min-w-0 flex-1 basis-0 *:[input]:text-[11px]",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupInput };
