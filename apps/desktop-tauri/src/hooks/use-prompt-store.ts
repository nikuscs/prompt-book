import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { promptSeed } from "@/data/prompt-seed";
import { UNNAMED_PROMPT_TITLE } from "@/lib/constants";
import type { Prompt } from "@/types/prompt";

const DELETE_CONFIRM_TIMEOUT_MS = 1600;
const COPY_FEEDBACK_TIMEOUT_MS = 1000;
const AUTOSAVE_DEBOUNCE_MS = 220;

type PromptsUpdatedPayload = {
  source: string;
};

function promptsEqual(a: Prompt[], b: Prompt[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (!left || !right) return false;
    if (
      left.id !== right.id ||
      left.title !== right.title ||
      left.content !== right.content ||
      left.copied !== right.copied ||
      left.searched !== right.searched
    ) {
      return false;
    }
  }
  return true;
}

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
  const skipNextPersistRef = useRef(false);
  const currentWindowLabelRef = useRef(getCurrentWindow().label);
  const promptsRef = useRef<Prompt[]>(promptSeed);

  const updatePrompts = useCallback((updater: Prompt[] | ((prev: Prompt[]) => Prompt[])) => {
    setPrompts((prev) => {
      const next = typeof updater === "function" ? (updater as (value: Prompt[]) => Prompt[])(prev) : updater;
      promptsRef.current = next;
      return next;
    });
  }, []);

  const persistPrompts = async (nextPrompts: Prompt[]): Promise<boolean> => {
    try {
      await invoke("save_prompts", { prompts: nextPrompts });
      return true;
    } catch (error) {
      console.error("Failed to save prompts:", error);
      return false;
    }
  };

  const reloadPrompts = useCallback(async () => {
    try {
      const loaded = await invoke<Prompt[]>("load_prompts");
      if (loaded.length === 0) {
        await persistPrompts(promptSeed);
        return;
      }

      let didChange = false;
      updatePrompts((prev) => {
        if (promptsEqual(prev, loaded)) return prev;
        didChange = true;
        return loaded;
      });
      if (!didChange) return;

      skipNextPersistRef.current = true;
      setSelectedId((prev) => (prev && loaded.some((prompt) => prompt.id === prev) ? prev : loaded[0]?.id ?? ""));
      setExpandedId((prev) => (prev && loaded.some((prompt) => prompt.id === prev) ? prev : loaded[0]?.id ?? ""));
    } catch (error) {
      console.error("Failed to load prompts:", error);
    }
  }, [updatePrompts]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const loaded = await invoke<Prompt[]>("load_prompts");
        if (cancelled) return;
        if (loaded.length > 0) {
          const first = loaded[0];
          if (!first) return;
          updatePrompts(loaded);
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
  }, [updatePrompts]);

  useEffect(() => {
    if (!loadedPromptsRef.current) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      void persistPrompts(prompts);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [prompts]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let mounted = true;
    const window = getCurrentWindow();

    void window.listen<PromptsUpdatedPayload>("prompts-updated", (event) => {
      const source = event.payload?.source;
      if (source && source === currentWindowLabelRef.current) return;
      void reloadPrompts();
    }).then((fn) => {
      if (!mounted) {
        fn();
        return;
      }
      unlisten = fn;
    });

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, [reloadPrompts]);

  const filteredPrompts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prompts;
    return prompts.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
  }, [prompts, search]);

  const forceSave = async (): Promise<boolean> => {
    return persistPrompts(promptsRef.current);
  };

  const savePrompt = (promptId: string, content: string) => {
    updatePrompts((prev) =>
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
    updatePrompts((prev) =>
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

  const savePromptTitleNow = async (promptId: string, title: string): Promise<boolean> => {
    const next = promptsRef.current.map((prompt) =>
      prompt.id === promptId
        ? {
            ...prompt,
            title,
          }
        : prompt,
    );
    promptsRef.current = next;
    setPrompts(next);
    return persistPrompts(next);
  };

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

  const addPrompt = () => {
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
  };

  const deletePrompt = (promptId: string) => {
    const remaining = promptsRef.current.filter((p) => p.id !== promptId);
    updatePrompts(remaining);

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
      await persistPrompts(promptsRef.current);
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
    savePromptTitleNow,
    copyPrompt,
    deletePrompt,
    requestDeleteConfirm,
    openPromptInEditor,
    copyPromptPath,
    reloadPrompts,
  };
}
