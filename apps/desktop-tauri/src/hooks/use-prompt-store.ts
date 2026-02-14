import { invoke } from "@tauri-apps/api/core";
import { useCallback, useMemo, useState } from "react";

import { usePromptPersistence } from "@/hooks/use-prompt-persistence";
import { UNNAMED_PROMPT_TITLE } from "@/lib/constants";
import type { Prompt } from "@/types/prompt";

const DELETE_CONFIRM_TIMEOUT_MS = 1600;
const COPY_FEEDBACK_TIMEOUT_MS = 1000;

export function usePromptStore() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleInitialLoad = useCallback((loaded: Prompt[]) => {
    const first = loaded[0];
    if (first) {
      setSelectedId(first.id);
      setExpandedId(first.id);
    }
  }, []);

  const handleExternalReload = useCallback((loaded: Prompt[]) => {
    setSelectedId((prev) => (prev && loaded.some((p) => p.id === prev) ? prev : loaded[0]?.id ?? ""));
    setExpandedId((prev) => (prev && loaded.some((p) => p.id === prev) ? prev : loaded[0]?.id ?? ""));
  }, []);

  const { prompts, promptsRef, updatePrompts, save, reloadPrompts, forceSave } = usePromptPersistence({
    onInitialLoad: handleInitialLoad,
    onExternalReload: handleExternalReload,
  });

  const filteredPrompts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prompts;
    return prompts.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
  }, [prompts, search]);

  const selectPrompt = (id: string) => setSelectedId(id);

  const toggleExpanded = (id: string) => {
    setSelectedId(id);
    setExpandedId((prev) => (prev === id ? "" : id));
  };

  const addPrompt = (): string => {
    const prompt: Prompt = {
      id: crypto.randomUUID(),
      title: UNNAMED_PROMPT_TITLE,
      content: "## Task\n",
      copied: 0,
      searched: 0,
    };
    updatePrompts((prev) => [prompt, ...prev]);
    setSelectedId(prompt.id);
    setExpandedId(prompt.id);
    return prompt.id;
  };

  const savePrompt = (id: string, content: string) => {
    updatePrompts((prev) => prev.map((p) => (p.id === id ? { ...p, content } : p)));
  };

  const savePromptTitleNow = async (id: string, title: string): Promise<boolean> => {
    const next = promptsRef.current.map((p) => (p.id === id ? { ...p, title } : p));
    updatePrompts(next);
    return save(next);
  };

  const deletePrompt = (id: string) => {
    const remaining = promptsRef.current.filter((p) => p.id !== id);
    updatePrompts(remaining);

    if (remaining.length === 0) {
      setSelectedId("");
      setExpandedId("");
      return;
    }

    if (selectedId === id) {
      const first = remaining[0];
      if (first) setSelectedId(first.id);
    }
    if (expandedId === id) {
      const first = remaining[0];
      if (first) setExpandedId(first.id);
    }
    if (editingTitleId === id) {
      setEditingTitleId(null);
      setEditingTitleValue("");
    }
    if (deleteConfirmId === id) {
      setDeleteConfirmId(null);
    }
  };

  const startEditTitle = (prompt: Prompt) => {
    setEditingTitleId(prompt.id);
    setEditingTitleValue(prompt.title || UNNAMED_PROMPT_TITLE);
  };

  const commitTitle = async (id: string, value: string): Promise<boolean> => {
    const normalized = value.trim() || UNNAMED_PROMPT_TITLE;
    setEditingTitleId(null);
    return savePromptTitleNow(id, normalized);
  };

  const cancelEditTitle = () => setEditingTitleId(null);

  const copyPrompt = async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedId(prompt.id);
      updatePrompts((prev) => prev.map((p) => (p.id === prompt.id ? { ...p, copied: p.copied + 1 } : p)));
      setTimeout(() => setCopiedId((id) => (id === prompt.id ? null : id)), COPY_FEEDBACK_TIMEOUT_MS);
    } catch (error) {
      console.error("Failed to copy prompt:", error);
    }
  };

  const requestDeleteConfirm = (id: string) => {
    setDeleteConfirmId(id);
    setTimeout(() => setDeleteConfirmId((prev) => (prev === id ? null : prev)), DELETE_CONFIRM_TIMEOUT_MS);
  };

  const openPromptInEditor = async (prompt: Prompt, editor: "cursor" | "vscode" | "zed") => {
    try {
      await invoke("open_prompt_in_editor", { editor, title: prompt.title, content: prompt.content });
    } catch (error) {
      console.error(`Failed to open prompt in ${editor}:`, error);
    }
  };

  const copyPromptPath = async (prompt: Prompt) => {
    try {
      await save(promptsRef.current);
      const path = await invoke<string>("get_prompt_path", { promptId: prompt.id, title: prompt.title });
      await navigator.clipboard.writeText(path);
    } catch (error) {
      console.error("Failed to copy prompt path:", error);
    }
  };

  return {
    prompts,
    filteredPrompts,
    search,
    selectedId,
    expandedId,
    copiedId,
    deleteConfirmId,
    editingTitleId,
    editingTitleValue,
    setSelectedId,
    setExpandedId,
    setSearch,
    selectPrompt,
    toggleExpanded,
    addPrompt,
    savePrompt,
    commitTitle,
    startEditTitle,
    cancelEditTitle,
    copyPrompt,
    deletePrompt,
    requestDeleteConfirm,
    openPromptInEditor,
    copyPromptPath,
    reloadPrompts,
    forceSave,
  };
}
