import { createContext, useContext } from "react";
import type { Prompt } from "@/types/prompt";

export type PromptStoreContextType = {
  promptCount: number;
  filteredPrompts: Prompt[];
  search: string;
  selectedId: string;
  expandedId: string;
  copiedId: string | null;
  deleteConfirmId: string | null;
  editingTitleId: string | null;
  editingTitleValue: string;
  focusPromptRequest: { promptId: string; token: number } | null;
  setSearch: (value: string) => void;
  addPrompt: () => string;
  selectPrompt: (id: string) => void;
  toggleExpanded: (id: string) => void;
  copyPrompt: (prompt: Prompt) => void;
  changeContent: (id: string, value: string) => void;
  startEditTitle: (prompt: Prompt) => void;
  commitTitle: (id: string, value: string) => void;
  cancelEditTitle: () => void;
  requestDeleteConfirm: (id: string) => void;
  deletePrompt: (id: string) => void;
  openInEditor: (prompt: Prompt, editor: "cursor" | "vscode" | "zed") => void;
  copyPath: (prompt: Prompt) => void;
  editInMainWindow: (prompt: Prompt) => void;
};

const PromptStoreContext = createContext<PromptStoreContextType | null>(null);

export const PromptStoreProvider = PromptStoreContext.Provider;

export function usePromptStoreContext(): PromptStoreContextType {
  const context = useContext(PromptStoreContext);
  if (!context) throw new Error("usePromptStoreContext must be used within PromptStoreProvider");
  return context;
}
