import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef, useState } from "react";

import { WindowMainView } from "@/components/windows/window-main-view";
import { WindowMenubarView } from "@/components/windows/window-menubar-view";
import { PromptStoreProvider, type PromptStoreContextType } from "@/contexts/prompt-store-context";
import { usePromptStore } from "@/hooks/use-prompt-store";
import { useTauriEvent } from "@/hooks/use-tauri-event";
import { useWindowGuards } from "@/hooks/use-window-guards";
import { useWindowMainSize, useWindowMenubarSize } from "@/hooks/use-window-size";

type FocusPromptEditorPayload = { promptId: string };

function App() {
  const [windowLabel, setWindowLabel] = useState("main");
  const [focusPromptRequest, setFocusPromptRequest] = useState<{ promptId: string; token: number } | null>(null);
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const menubarContentRef = useRef<HTMLDivElement | null>(null);
  const menubarHeaderRef = useRef<HTMLDivElement | null>(null);
  const menubarListInnerRef = useRef<HTMLDivElement | null>(null);
  const saveToastTimerRef = useRef<number | null>(null);

  const store = usePromptStore();

  const showSaveToast = useCallback(() => {
    setSaveToastVisible(true);
    if (saveToastTimerRef.current !== null) window.clearTimeout(saveToastTimerRef.current);
    saveToastTimerRef.current = window.setTimeout(() => {
      setSaveToastVisible(false);
      saveToastTimerRef.current = null;
    }, 1200);
  }, []);

  useEffect(() => {
    return () => {
      if (saveToastTimerRef.current !== null) window.clearTimeout(saveToastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setWindowLabel(getCurrentWindow().label);
  }, []);

  useEffect(() => {
    if (windowLabel !== "menubar") return;
    void store.reloadPrompts();
  }, [windowLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  useTauriEvent("menubar-opened", () => {
    if (windowLabel !== "menubar") return;
    void store.reloadPrompts();
  });

  useEffect(() => {
    if (windowLabel !== "menubar") return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void store.reloadPrompts();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [store.reloadPrompts, windowLabel]);

  useEffect(() => {
    if (windowLabel !== "main") return;
    let unlisten: (() => void) | null = null;
    let mounted = true;

    void getCurrentWindow()
      .listen<FocusPromptEditorPayload>("focus-prompt-editor", (event) => {
        const promptId = event.payload?.promptId;
        if (!promptId) return;
        store.setSelectedId(promptId);
        store.setExpandedId(promptId);
        setFocusPromptRequest((prev) => ({ promptId, token: (prev?.token ?? 0) + 1 }));
      })
      .then((fn) => {
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
  }, [store.setSelectedId, store.setExpandedId, windowLabel]);

  useWindowGuards(
    useCallback(() => {
      void store.forceSave().then((saved) => {
        if (saved) showSaveToast();
      });
    }, [store.forceSave, showSaveToast]),
  );

  useEffect(() => {
    if (windowLabel !== "main") return;
    let unlisten: (() => void) | null = null;
    let mounted = true;

    void getCurrentWindow()
      .onFocusChanged(({ payload: focused }) => {
        if (focused) return;
        void store.forceSave();
      })
      .then((fn) => {
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
  }, [store.forceSave, windowLabel]);

  useWindowMainSize({
    enabled: windowLabel === "main",
    contentRef: mainContentRef,
    deps: [store.prompts, store.search, store.expandedId, store.editingTitleId],
  });

  useWindowMenubarSize({
    enabled: windowLabel === "menubar",
    contentRef: menubarContentRef,
    headerRef: menubarHeaderRef,
    listInnerRef: menubarListInnerRef,
    deps: [store.filteredPrompts, store.copiedId],
  });

  const contextValue: PromptStoreContextType = {
    filteredPrompts: store.filteredPrompts,
    search: store.search,
    selectedId: store.selectedId,
    expandedId: store.expandedId,
    copiedId: store.copiedId,
    deleteConfirmId: store.deleteConfirmId,
    editingTitleId: store.editingTitleId,
    editingTitleValue: store.editingTitleValue,
    focusPromptRequest,
    setSearch: store.setSearch,
    addPrompt: store.addPrompt,
    selectPrompt: store.selectPrompt,
    toggleExpanded: store.toggleExpanded,
    copyPrompt: store.copyPrompt,
    changeContent: store.savePrompt,
    startEditTitle: store.startEditTitle,
    commitTitle: (id, value) => {
      void store.commitTitle(id, value).then((saved) => {
        if (saved) showSaveToast();
      });
    },
    cancelEditTitle: store.cancelEditTitle,
    requestDeleteConfirm: store.requestDeleteConfirm,
    deletePrompt: store.deletePrompt,
    openInEditor: store.openPromptInEditor,
    copyPath: store.copyPromptPath,
    editInMainWindow: (prompt) => {
      void invoke("open_main_window_for_prompt", { promptId: prompt.id });
    },
  };

  const openMainWindow = async () => {
    await invoke("open_main_window");
  };

  const startDrag = () => {
    if (windowLabel !== "main") return;
    void getCurrentWindow().startDragging();
  };

  if (windowLabel === "menubar") {
    return (
      <PromptStoreProvider value={contextValue}>
        <WindowMenubarView
          saveToastVisible={saveToastVisible}
          contentRef={menubarContentRef}
          headerRef={menubarHeaderRef}
          listInnerRef={menubarListInnerRef}
          onOpenMainWindow={openMainWindow}
        />
      </PromptStoreProvider>
    );
  }

  return (
    <PromptStoreProvider value={contextValue}>
      <WindowMainView saveToastVisible={saveToastVisible} contentRef={mainContentRef} onStartDrag={startDrag} />
    </PromptStoreProvider>
  );
}

export default App;
