import { useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { PromptCardMain } from "@/components/prompt-card-main";
import { PromptCardMenubar } from "@/components/prompt-card-menubar";
import { usePromptStoreContext } from "@/contexts/prompt-store-context";
import type { Prompt } from "@/types/prompt";

function SortableItem({ prompt, variant }: { prompt: Prompt; variant: "main" | "menubar" }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({ id: prompt.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = { ref: setActivatorNodeRef, listeners };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="outline-none">
      {variant === "main" ? (
        <PromptCardMain prompt={prompt} dragHandle={dragHandle} />
      ) : (
        <PromptCardMenubar prompt={prompt} dragHandle={dragHandle} />
      )}
    </div>
  );
}

export function PromptList({ variant }: { variant: "main" | "menubar" }) {
  const { filteredPrompts, search, selectedId, selectPrompt, reorderPrompts } = usePromptStoreContext();
  const isSearching = search.trim().length > 0;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if ((event.target as HTMLElement).isContentEditable) return;

      if (filteredPrompts.length === 0) return;
      const idx = filteredPrompts.findIndex((p) => p.id === selectedId);
      const next = event.key === "ArrowDown"
        ? Math.min(idx + 1, filteredPrompts.length - 1)
        : Math.max(idx - 1, 0);
      if (next === idx) return;

      const target = filteredPrompts[next];
      if (!target) return;
      event.preventDefault();
      selectPrompt(target.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredPrompts, selectedId, selectPrompt]);

  if (isSearching) {
    const Card = variant === "main" ? PromptCardMain : PromptCardMenubar;
    return (
      <div className="space-y-1.5">
        {filteredPrompts.map((prompt) => (
          <Card key={prompt.id} prompt={prompt} />
        ))}
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filteredPrompts.findIndex((p) => p.id === active.id);
    const newIndex = filteredPrompts.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderPrompts(arrayMove(filteredPrompts, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={filteredPrompts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {filteredPrompts.map((prompt) => (
            <SortableItem key={prompt.id} prompt={prompt} variant={variant} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
