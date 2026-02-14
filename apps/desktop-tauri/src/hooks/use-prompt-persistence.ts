import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef, useState } from "react";

import { useTauriEvent } from "@/hooks/use-tauri-event";
import type { Prompt } from "@/types/prompt";

const AUTOSAVE_DEBOUNCE_MS = 220;

type PromptsUpdatedPayload = { source: string };

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

export function usePromptPersistence(callbacks?: {
  onInitialLoad?: (prompts: Prompt[]) => void;
  onExternalReload?: (prompts: Prompt[]) => void;
}) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const promptsRef = useRef<Prompt[]>([]);
  const loadedRef = useRef(false);
  const skipNextPersistRef = useRef(false);
  const windowLabelRef = useRef(getCurrentWindow().label);
  const onInitialLoadRef = useRef(callbacks?.onInitialLoad);
  const onExternalReloadRef = useRef(callbacks?.onExternalReload);
  onInitialLoadRef.current = callbacks?.onInitialLoad;
  onExternalReloadRef.current = callbacks?.onExternalReload;

  const updatePrompts = useCallback((updater: Prompt[] | ((prev: Prompt[]) => Prompt[])) => {
    setPrompts((prev) => {
      const next = typeof updater === "function" ? (updater as (v: Prompt[]) => Prompt[])(prev) : updater;
      promptsRef.current = next;
      return next;
    });
  }, []);

  const save = useCallback(async (data: Prompt[]): Promise<boolean> => {
    try {
      await invoke("save_prompts", { prompts: data });
      return true;
    } catch (error) {
      console.error("Failed to save prompts:", error);
      return false;
    }
  }, []);

  const reloadPrompts = useCallback(async () => {
    try {
      const loaded = await invoke<Prompt[]>("load_prompts");
      let didChange = false;
      updatePrompts((prev) => {
        if (promptsEqual(prev, loaded)) return prev;
        didChange = true;
        return loaded;
      });
      if (!didChange) return;
      skipNextPersistRef.current = true;
      onExternalReloadRef.current?.(loaded);
    } catch (error) {
      console.error("Failed to load prompts:", error);
    }
  }, [updatePrompts, save]);

  const forceSave = useCallback(async (): Promise<boolean> => {
    return save(promptsRef.current);
  }, [save]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const loaded = await invoke<Prompt[]>("load_prompts");
        if (cancelled) return;
        if (loaded.length > 0) {
          updatePrompts(loaded);
          onInitialLoadRef.current?.(loaded);
        }
      } catch (error) {
        console.error("Failed to load prompts:", error);
      } finally {
        loadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [updatePrompts, save]);

  useEffect(() => {
    if (!loadedRef.current) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      void save(prompts);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [prompts, save]);

  useTauriEvent<PromptsUpdatedPayload>("prompts-updated", (event) => {
    const source = event.payload?.source;
    if (source && source === windowLabelRef.current) return;
    void reloadPrompts();
  });

  return { prompts, promptsRef, updatePrompts, save, reloadPrompts, forceSave };
}
