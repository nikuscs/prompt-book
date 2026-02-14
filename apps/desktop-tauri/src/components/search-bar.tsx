import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  onAdd?: () => void;
  className?: string;
};

export function SearchBar({
  value,
  onChange,
  autoFocus = false,
  onAdd,
  className,
}: SearchBarProps) {
  return (
    <InputGroup
      className={cn(
        "has-focus-visible:ring-0 has-focus-visible:border-input",
        className,
      )}
    >
      <InputGroupInput
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search prompts..."
      />
      {onAdd ? (
        <InputGroupAddon align="inline-end">
          <Button size="xs" variant="secondary" className="rounded-sm px-2 text-[11px]" onClick={onAdd}>
            <Plus className="size-3" />
            Add
          </Button>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
