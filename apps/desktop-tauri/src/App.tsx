import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";

import { WindowMainView } from "@/components/windows/window-main-view";
import { WindowMenubarView } from "@/components/windows/window-menubar-view";
import { usePromptStore } from "@/hooks/use-prompt-store";
import { useWindowGuards } from "@/hooks/use-window-guards";
import { useWindowMainSize, useWindowMenubarSize } from "@/hooks/use-window-size";
import { UNNAMED_PROMPT_TITLE } from "@/lib/constants";
import type { Prompt } from "@/types/prompt";

type FocusPromptEditorPayload = {
  promptId: string;
};

function App() {
  const [windowLabel, setWindowLabel] = useState("main");
  const [focusPromptRequest, setFocusPromptRequest] = useState<{ promptId: string; token: number } | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const menubarContentRef = useRef<HTMLDivElement | null>(null);
  const menubarHeaderRef = useRef<HTMLDivElement | null>(null);
  const menubarListInnerRef = useRef<HTMLDivElement | null>(null);

  const promptStore = usePromptStore();
  const { setSelectedId, setExpandedId } = promptStore;

  useEffect(() => {
    setWindowLabel(getCurrentWindow().label);
  }, []);

  useEffect(() => {
    if (windowLabel !== "main") return;
    let unlisten: (() => void) | null = null;
    let mounted = true;

    void listen<FocusPromptEditorPayload>("focus-prompt-editor", (event) => {
      const promptId = event.payload?.promptId;
      if (!promptId) return;
      setSelectedId(promptId);
      setExpandedId(promptId);
      setFocusPromptRequest((prev) => ({
        promptId,
        token: (prev?.token ?? 0) + 1,
      }));
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
  }, [setExpandedId, setSelectedId, windowLabel]);

  useWindowGuards(() => {
    void promptStore.forceSave();
  });

  useWindowMainSize({
    enabled: windowLabel === "main",
    contentRef: mainContentRef,
    deps: [promptStore.prompts, promptStore.search, promptStore.expandedId, promptStore.editingTitleId],
  });

  const { listHeight } = useWindowMenubarSize({
    enabled: windowLabel === "menubar",
    contentRef: menubarContentRef,
    headerRef: menubarHeaderRef,
    listInnerRef: menubarListInnerRef,
    deps: [promptStore.filteredPrompts, promptStore.copiedId],
  });

  const openMainWindow = async () => {
    await invoke("open_main_window");
  };

  const startWindowDrag = () => {
    if (windowLabel !== "main") return;
    void getCurrentWindow().startDragging();
  };

  const toggleMainPrompt = (promptId: string) => {
    promptStore.setSelectedId(promptId);
    promptStore.setExpandedId((prev) => (prev === promptId ? "" : promptId));
  };

  const startEditPrompt = (prompt: Prompt) => {
    promptStore.setEditingTitleId(prompt.id);
    promptStore.setEditingTitleValue(prompt.title || UNNAMED_PROMPT_TITLE);
  };

  const commitPromptTitle = (promptId: string, value: string) => {
    promptStore.savePromptTitle(promptId, value);
    promptStore.setEditingTitleId(null);
  };

  if (windowLabel === "menubar") {
    return (
      <WindowMenubarView
        prompts={promptStore.filteredPrompts}
        selectedId={promptStore.selectedId}
        copiedId={promptStore.copiedId}
        search={promptStore.search}
        listHeight={listHeight}
        contentRef={menubarContentRef}
        headerRef={menubarHeaderRef}
        listInnerRef={menubarListInnerRef}
        onSearchChange={promptStore.setSearch}
        onAddPrompt={promptStore.addPrompt}
        onOpenMainWindow={openMainWindow}
        onSelectPrompt={promptStore.setSelectedId}
        onCopyPrompt={promptStore.copyPrompt}
        onEditPrompt={(prompt) => {
          void invoke("open_main_window_for_prompt", { promptId: prompt.id });
        }}
        onOpenPromptInEditor={promptStore.openPromptInEditor}
        onCopyPromptPath={promptStore.copyPromptPath}
      />
    );
  }

  return (
    <WindowMainView
      prompts={promptStore.filteredPrompts}
      search={promptStore.search}
      selectedId={promptStore.selectedId}
      expandedId={promptStore.expandedId}
      copiedId={promptStore.copiedId}
      deleteConfirmId={promptStore.deleteConfirmId}
      editingTitleId={promptStore.editingTitleId}
      editingTitleValue={promptStore.editingTitleValue}
      focusPromptRequest={focusPromptRequest}
      contentRef={mainContentRef}
      onSearchChange={promptStore.setSearch}
      onAddPrompt={promptStore.addPrompt}
      onStartDrag={startWindowDrag}
      onSelectPrompt={promptStore.setSelectedId}
      onTogglePrompt={toggleMainPrompt}
      onStartEditPrompt={startEditPrompt}
      onCommitPromptTitle={commitPromptTitle}
      onCancelEditPrompt={() => promptStore.setEditingTitleId(null)}
      onCopyPrompt={promptStore.copyPrompt}
      onOpenPromptInEditor={promptStore.openPromptInEditor}
      onCopyPromptPath={promptStore.copyPromptPath}
      onRequestDeleteConfirm={promptStore.requestDeleteConfirm}
      onDeletePrompt={promptStore.deletePrompt}
      onChangePromptContent={promptStore.savePrompt}
    />
  );
}

export default App;
