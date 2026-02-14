import { PromptCardMain } from "@/components/prompt-card-main";
import { PromptCardMenubar } from "@/components/prompt-card-menubar";
import { usePromptStoreContext } from "@/contexts/prompt-store-context";

export function PromptList({ variant }: { variant: "main" | "menubar" }) {
  const { filteredPrompts } = usePromptStoreContext();
  const Card = variant === "main" ? PromptCardMain : PromptCardMenubar;

  return (
    <div className="space-y-1.5">
      {filteredPrompts.map((prompt) => (
        <Card key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
