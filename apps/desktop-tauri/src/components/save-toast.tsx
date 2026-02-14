import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type SaveToastProps = {
  visible: boolean;
  className?: string;
};

export function SaveToast({ visible, className }: SaveToastProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-2 left-1/2 z-40 -translate-x-1/2 transition-all duration-200",
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        className,
      )}
      aria-live="polite"
      role="status"
    >
      <div className="inline-flex items-center gap-1 rounded-md border border-success/45 bg-success/12 px-2 py-1 text-[10px] font-medium text-success shadow-sm backdrop-blur">
        <Check className="size-2.5" />
        Saved
      </div>
    </div>
  );
}
