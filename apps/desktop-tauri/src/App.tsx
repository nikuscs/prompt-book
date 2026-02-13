import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptCard } from "@/components/prompt-card";
import { SearchBar } from "@/components/search-bar";
import { ScrollAreaVanilla } from "@/components/ui/scroll-area-vanilla";

type Prompt = {
  id: string;
  title: string;
  content: string;
  copied: number;
  searched: number;
};

const MAIN_WINDOW_WIDTH = 720;
const MAIN_WINDOW_MIN_HEIGHT = 280;
const MAIN_WINDOW_MAX_HEIGHT = 620;
const MAIN_LIST_MAX_HEIGHT = 430;
const MENUBAR_WINDOW_WIDTH = 330;
const MENUBAR_WINDOW_MIN_HEIGHT = 320;
const MENUBAR_WINDOW_MAX_HEIGHT = 520;
const MENUBAR_LIST_MIN_HEIGHT = 110;
const MENUBAR_LIST_MAX_HEIGHT = 340;

const seedPrompts: Prompt[] = [
  {
    id: "1",
    title: "Bug Triage",
    content: "## Task\nReview this bug report and return:\n1. Root cause\n2. Minimal fix\n3. Regression tests",
    copied: 12,
    searched: 7,
  },
  {
    id: "2",
    title: "PR Review",
    content: "Review this PR like a senior engineer. Focus on:\n- behavior regressions\n- missing tests\n- performance risks",
    copied: 20,
    searched: 11,
  },
  {
    id: "3",
    title: "Release Notes",
    content: "Write concise release notes from commits grouped by:\n- feature\n- fix\n- chore\nInclude migration warnings and known issues.",
    copied: 8,
    searched: 5,
  },
];

function App() {
  const [prompts, setPrompts] = useState<Prompt[]>(seedPrompts);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(seedPrompts[0].id);
  const [expandedId, setExpandedId] = useState(seedPrompts[0].id);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [windowLabel, setWindowLabel] = useState("main");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const menubarContentRef = useRef<HTMLDivElement | null>(null);
  const menubarHeaderRef = useRef<HTMLDivElement | null>(null);
  const menubarListInnerRef = useRef<HTMLDivElement | null>(null);
  const menubarLastHeightRef = useRef<number>(0);
  const loadedPromptsRef = useRef(false);
  const [menubarListHeight, setMenubarListHeight] = useState<number>(MENUBAR_LIST_MIN_HEIGHT);

  const persistPrompts = async (nextPrompts: Prompt[]) => {
    try {
      await invoke("save_prompts", { prompts: nextPrompts });
    } catch (error) {
      console.error("Failed to save prompts:", error);
    }
  };

  useEffect(() => {
    setWindowLabel(getCurrentWindow().label);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const loaded = await invoke<Prompt[]>("load_prompts");
        if (cancelled) return;
        if (loaded.length > 0) {
          setPrompts(loaded);
          setSelectedId(loaded[0].id);
          setExpandedId(loaded[0].id);
        } else {
          await persistPrompts(seedPrompts);
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
    }, 220);
    return () => clearTimeout(timeout);
  }, [prompts]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isSave = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
      if (!isSave) return;
      event.preventDefault();
      void persistPrompts(prompts);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prompts]);

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const reload = key === "f5" || ((event.metaKey || event.ctrlKey) && key === "r");
      const inspect =
        key === "f12" ||
        ((event.metaKey || event.ctrlKey) && event.altKey && key === "i");
      if (!reload && !inspect) return;
      event.preventDefault();
    };

    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  useEffect(() => {
    if (windowLabel !== "main") return;
    const window = getCurrentWindow();
    const resizeToContent = () => {
      const content = mainContentRef.current;
      if (!content) return;
      const desiredHeight = Math.ceil(content.scrollHeight + 18);
      const nextHeight = Math.min(MAIN_WINDOW_MAX_HEIGHT, Math.max(MAIN_WINDOW_MIN_HEIGHT, desiredHeight));
      void window.setSize(new LogicalSize(MAIN_WINDOW_WIDTH, nextHeight));
    };

    const timer = setTimeout(resizeToContent, 20);
    const observer = new ResizeObserver(() => resizeToContent());
    if (mainContentRef.current) observer.observe(mainContentRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [windowLabel, prompts, search, expandedId, editingTitleId]);

  const filteredPrompts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prompts;
    return prompts.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
  }, [prompts, search]);

  useEffect(() => {
    if (windowLabel !== "menubar") return;
    const window = getCurrentWindow();
    const resizeToContent = () => {
      const header = menubarHeaderRef.current;
      const listInner = menubarListInnerRef.current;
      if (!header || !listInner) return;

      const naturalListHeight = Math.ceil(listInner.scrollHeight);
      const nextListHeight = Math.min(
        MENUBAR_LIST_MAX_HEIGHT,
        Math.max(MENUBAR_LIST_MIN_HEIGHT, naturalListHeight),
      );

      setMenubarListHeight((prev) => (Math.abs(prev - nextListHeight) > 1 ? nextListHeight : prev));

      // 10px accounts for wrapper paddings/border gap around header + list areas.
      const desiredHeight = Math.ceil(header.offsetHeight + nextListHeight + 10);
      const nextHeight = Math.min(
        MENUBAR_WINDOW_MAX_HEIGHT,
        Math.max(MENUBAR_WINDOW_MIN_HEIGHT, desiredHeight),
      );

      if (Math.abs(nextHeight - menubarLastHeightRef.current) <= 1) return;
      menubarLastHeightRef.current = nextHeight;
      void window.setSize(new LogicalSize(MENUBAR_WINDOW_WIDTH, nextHeight));
    };

    const timer = setTimeout(resizeToContent, 20);
    const observer = new ResizeObserver(() => resizeToContent());
    if (menubarContentRef.current) observer.observe(menubarContentRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [windowLabel, filteredPrompts, copiedId]);

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
    setTimeout(() => setCopiedId((id) => (id === prompt.id ? null : id)), 1000);
  };

  const addPrompt = () => {
    const prompt: Prompt = {
      id: crypto.randomUUID(),
      title: "Unnamed",
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
      setSelectedId(remaining[0].id);
    }
    if (expandedId === promptId) {
      setExpandedId(remaining[0].id);
    }
    if (editingTitleId === promptId) {
      setEditingTitleId(null);
      setEditingTitleValue("");
    }
    if (deleteConfirmId === promptId) {
      setDeleteConfirmId(null);
    }
  };

  const openMainWindow = async () => {
    await invoke("open_main_window");
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

  const startWindowDrag = () => {
    if (windowLabel !== "main") return;
    void getCurrentWindow().startDragging();
  };

  if (windowLabel === "menubar") {
    return (
      <main className="h-screen w-screen overflow-hidden bg-transparent text-foreground">
        <div className="flex h-full w-full flex-col items-center bg-transparent p-3 pt-1.5">
          <div className="tray-arrow z-20 translate-y-1" />
          <div
            ref={menubarContentRef}
            className="relative mt-1 flex min-h-0 w-full flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-lg select-none"
          >
            <div ref={menubarHeaderRef} className="px-3 pb-2 pt-1.5">
              <div className="flex items-center justify-between gap-2 pb-2">
                <div className="text-[8px] tracking-[0.1em] text-muted-foreground/70" data-tauri-drag-region>
                  Promptbook ®
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="size-5 rounded-sm p-0"
                  onClick={openMainWindow}
                  title="Open full window"
                  tabIndex={-1}
                >
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-1.5">
                <SearchBar autoFocus value={search} onChange={setSearch} onAdd={addPrompt} className="flex-1" />
              </div>
            </div>
            <div className="px-3 pb-2.5 pt-0">
              <ScrollAreaVanilla
                className="min-h-0"
                viewportClassName="p-0 pr-1 pb-1"
                showScrollIndicators
                style={{ height: `${menubarListHeight}px` }}
              >
                <div ref={menubarListInnerRef} className="space-y-1.5">
                  {filteredPrompts.map((prompt) => {
                    const selected = prompt.id === selectedId;
                    const isCopied = copiedId === prompt.id;
                    return (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        variant="menubar"
                        selected={selected}
                        isCopied={isCopied}
                        onSelect={() => setSelectedId(prompt.id)}
                        onCopy={() => copyPrompt(prompt)}
                        onOpenInEditor={(editor) => openPromptInEditor(prompt, editor)}
                        onCopyPath={() => copyPromptPath(prompt)}
                      />
                    );
                  })}
                </div>
              </ScrollAreaVanilla>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background px-4 pb-4 pt-11 text-foreground">
      <div className="absolute left-28 right-0 top-0 h-10" data-tauri-drag-region onMouseDown={startWindowDrag} />
      <div ref={mainContentRef} className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 flex items-center gap-2 pb-2">
          <SearchBar value={search} onChange={setSearch} onAdd={addPrompt} className="flex-1" />
        </div>
        <ScrollAreaVanilla
          className="min-h-0 flex-1"
          viewportClassName="p-0 pr-1 pb-1"
          style={{ maxHeight: `${MAIN_LIST_MAX_HEIGHT}px` }}
          showScrollIndicators
        >
          <div className="space-y-1.5">
            {filteredPrompts.map((prompt) => {
              const isExpanded = expandedId === prompt.id;
              const isCopied = copiedId === prompt.id;
              const isDeleteConfirm = deleteConfirmId === prompt.id;
              return (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  variant="main"
                  isExpanded={isExpanded}
                  isCopied={isCopied}
                  isDeleteConfirm={isDeleteConfirm}
                  editingTitle={editingTitleId === prompt.id}
                  editingTitleValue={editingTitleValue}
                  onToggle={() => {
                    setSelectedId(prompt.id);
                    setExpandedId((prev) => (prev === prompt.id ? "" : prompt.id));
                  }}
                  onStartEdit={() => {
                    setEditingTitleId(prompt.id);
                    setEditingTitleValue(prompt.title || "Unnamed");
                  }}
                  onCommitTitle={(value) => {
                    savePromptTitle(prompt.id, value);
                    setEditingTitleId(null);
                  }}
                  onCancelEdit={() => setEditingTitleId(null)}
                  onCopy={() => copyPrompt(prompt)}
                  onOpenInEditor={(editor) => openPromptInEditor(prompt, editor)}
                  onCopyPath={() => copyPromptPath(prompt)}
                  onRequestDeleteConfirm={() => {
                    setDeleteConfirmId(prompt.id);
                    setTimeout(() => {
                      setDeleteConfirmId((id) => (id === prompt.id ? null : id));
                    }, 1600);
                  }}
                  onDelete={() => deletePrompt(prompt.id)}
                  onContentChange={(value) => savePrompt(prompt.id, value)}
                />
              );
            })}
          </div>
        </ScrollAreaVanilla>
      </div>
    </main>
  );
}

export default App;
