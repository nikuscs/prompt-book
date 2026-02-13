import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useRef, useState } from "react";

import { promptSeed } from "@/data/prompt-seed";
import { UNNAMED_PROMPT_TITLE } from "@/lib/constants";
import type { Prompt } from "@/types/prompt";

const DELETE_CONFIRM_TIMEOUT_MS = 1600;
const COPY_FEEDBACK_TIMEOUT_MS = 1000;
const AUTOSAVE_DEBOUNCE_MS = 220;

export function usePromptStore() {
  const [prompts, setPrompts] = useState<Prompt[]>(promptSeed);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(promptSeed[0]?.id ?? "");
  const [expandedId, setExpandedId] = useState(promptSeed[0]?.id ?? "");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const loadedPromptsRef = useRef(false);

  const persistPrompts = async (nextPrompts: Prompt[]) => {
    try {
      await invoke("save_prompts", { prompts: nextPrompts });
    } catch (error) {
      console.error("Failed to save prompts:", error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const loaded = await invoke<Prompt[]>("load_prompts");
        if (cancelled) return;
        if (loaded.length > 0) {
          const first = loaded[0];
          if (!first) return;
          setPrompts(loaded);
          setSelectedId(first.id);
          setExpandedId(first.id);
        } else {
          await persistPrompts(promptSeed);
        }
      } catch (error) {
        console.error("Failed to load prompts:", error);
      } finally {
        loadedPromptsRef.current = true;
      }
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loadedPromptsRef.current) return;
    const timeout = setTimeout(() => {
      void persistPrompts(prompts);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prompts;
    return prompts.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
  }, [prompts, search]);

  const forceSave = async () => {
    await persistPrompts(prompts);
  };

  const savePrompt = (promptId: string, content: string) => {
    setPrompts((prev) =>
      prev.map((prompt) =>
        prompt.id === promptId
          ? {
              ...prompt,
              content,
            }
          : prompt,
      ),
    );
  };

  const savePromptTitle = (promptId: string, title: string) => {
    setPrompts((prev) =>
      prev.map((prompt) =>
        prompt.id === promptId
          ? {
              ...prompt,
              title,
            }
          : prompt,
      ),
    );
  };

  const copyPrompt = async (prompt: Prompt) => {
    await navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    setPrompts((prev) => prev.map((p) => (p.id === prompt.id ? { ...p, copied: p.copied + 1 } : p)));
    setTimeout(() => setCopiedId((id) => (id === prompt.id ? null : id)), COPY_FEEDBACK_TIMEOUT_MS);
  };

  const addPrompt = () => {
    const prompt: Prompt = {
      id: crypto.randomUUID(),
      title: UNNAMED_PROMPT_TITLE,
      content: "## Task\n",
      copied: 0,
      searched: 0,
    };
    setPrompts((prev) => [prompt, ...prev]);
    setSelectedId(prompt.id);
    setExpandedId(prompt.id);
  };

  const deletePrompt = (promptId: string) => {
    const remaining = prompts.filter((p) => p.id !== promptId);
    setPrompts(remaining);

    if (remaining.length === 0) {
      setSelectedId("");
      setExpandedId("");
      return;
    }

    if (selectedId === promptId) {
      const first = remaining[0];
      if (first) setSelectedId(first.id);
    }
    if (expandedId === promptId) {
      const first = remaining[0];
      if (first) setExpandedId(first.id);
    }
    if (editingTitleId === promptId) {
      setEditingTitleId(null);
      setEditingTitleValue("");
    }
    if (deleteConfirmId === promptId) {
      setDeleteConfirmId(null);
    }
  };

  const requestDeleteConfirm = (promptId: string) => {
    setDeleteConfirmId(promptId);
    setTimeout(() => {
      setDeleteConfirmId((id) => (id === promptId ? null : id));
    }, DELETE_CONFIRM_TIMEOUT_MS);
  };

  const openPromptInEditor = async (prompt: Prompt, editor: "cursor" | "vscode" | "zed") => {
    try {
      await invoke("open_prompt_in_editor", {
        editor,
        title: prompt.title,
        content: prompt.content,
      });
    } catch (error) {
      console.error(`Failed to open prompt in ${editor}:`, error);
    }
  };

  const copyPromptPath = async (prompt: Prompt) => {
    try {
      await persistPrompts(prompts);
      const path = await invoke<string>("get_prompt_path", {
        promptId: prompt.id,
        title: prompt.title,
      });
      await navigator.clipboard.writeText(path);
    } catch (error) {
      console.error("Failed to copy prompt path:", error);
    }
  };

  return {
    prompts,
    filteredPrompts,
    search,
    setSearch,
    selectedId,
    setSelectedId,
    expandedId,
    setExpandedId,
    editingTitleId,
    setEditingTitleId,
    editingTitleValue,
    setEditingTitleValue,
    copiedId,
    deleteConfirmId,
    forceSave,
    addPrompt,
    savePrompt,
    savePromptTitle,
    copyPrompt,
    deletePrompt,
    requestDeleteConfirm,
    openPromptInEditor,
    copyPromptPath,
  };
}
