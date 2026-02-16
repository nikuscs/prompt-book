import type { useSortable } from "@dnd-kit/sortable";

type SortableReturn = ReturnType<typeof useSortable>;

export type DragHandleProps = {
  ref: SortableReturn["setActivatorNodeRef"];
  listeners: SortableReturn["listeners"];
};
