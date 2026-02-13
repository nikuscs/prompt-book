import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Check, ChevronDown, Copy, Expand, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollAreaVanilla } from "@/components/ui/scroll-area-vanilla";
import { Textarea } from "@/components/ui/textarea";

type Prompt = {
  id: string;
  title: string;
  content: string;
  copied: number;
  searched: number;
};

const PROMPTS_STORAGE_KEY = "promptbook.prompts.v1";
const MAIN_WINDOW_WIDTH = 720;
const MAIN_WINDOW_MIN_HEIGHT = 280;
const MAIN_WINDOW_MAX_HEIGHT = 620;
const MAIN_LIST_MAX_HEIGHT = 430;

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

function getPromptPreview(content: string): string {
  return content
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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

  const persistPrompts = (nextPrompts: Prompt[]) => {
    try {
      localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(nextPrompts));
    } catch (error) {
      console.error("Failed to save prompts:", error);
    }
  };

  useEffect(() => {
    setWindowLabel(getCurrentWindow().label);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROMPTS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Prompt[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      setPrompts(parsed);
      setSelectedId(parsed[0].id);
      setExpandedId(parsed[0].id);
    } catch (error) {
      console.error("Failed to load prompts:", error);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      persistPrompts(prompts);
    }, 220);
    return () => clearTimeout(timeout);
  }, [prompts]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isSave = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
      if (!isSave) return;
      event.preventDefault();
      persistPrompts(prompts);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prompts]);

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

  const startWindowDrag = () => {
    if (windowLabel !== "main") return;
    void getCurrentWindow().startDragging();
  };

  if (windowLabel === "menubar") {
    return (
      <main className="h-screen w-screen overflow-hidden bg-transparent text-foreground">
        <div className="flex h-full w-full flex-col items-center bg-transparent p-3 pt-1.5">
          <div className="tray-arrow z-20 translate-y-1" />
          <div className="relative mt-1 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-lg select-none">
            <div className="px-5 pb-2 pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1" data-tauri-drag-region>
                  <div className="text-sm font-semibold tracking-tight">PromptBook</div>
                  <p className="text-xs text-muted-foreground">Copy prompts fast</p>
                </div>
                <Button size="sm" variant="outline" onClick={openMainWindow}>
                  <Expand className="size-3.5" />
                  Full
                </Button>
              </div>
              <div className="mt-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prompts..." />
              </div>
            </div>
            <div className="min-h-0 flex-1 px-5 pb-4 pt-0">
              <ScrollArea className="h-full pr-1 scrollbar-none">
                <div className="space-y-1.5">
                  {filteredPrompts.map((prompt) => {
                    const selected = prompt.id === selectedId;
                    return (
                      <button
                        key={prompt.id}
                        onClick={async () => {
                          setSelectedId(prompt.id);
                          await copyPrompt(prompt);
                        }}
                        className={`group w-full rounded-xl border p-2.5 text-left transition ${
                          selected
                            ? "border-border bg-secondary"
                            : "border-transparent bg-transparent hover:border-border hover:bg-secondary"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-medium">{prompt.title}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {copiedId === prompt.id ? (
                              <Check className="size-3.5 text-success" />
                            ) : (
                              <Copy className="size-3.5 opacity-70 group-hover:opacity-100" />
                            )}
                          </div>
                        </div>
                        <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{prompt.content.split("\n")[0]}</div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
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
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="flex-1"
          />
          <Button variant="outline" onClick={addPrompt}>
            <Plus className="size-3.5" />
            Add
          </Button>
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
                <div key={prompt.id} className="rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                    <button
                      className="inline-flex cursor-pointer items-center justify-center rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => {
                        setSelectedId(prompt.id);
                        setExpandedId((prev) => (prev === prompt.id ? "" : prompt.id));
                      }}
                    >
                      <ChevronDown className={`size-3.5 text-muted-foreground transition ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <div
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
                      onClick={(e) => {
                        if (e.detail > 1 || editingTitleId === prompt.id) return;
                        setSelectedId(prompt.id);
                        setExpandedId((prev) => (prev === prompt.id ? "" : prompt.id));
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingTitleId(prompt.id);
                        setEditingTitleValue(prompt.title || "Unnamed");
                      }}
                    >
                      {editingTitleId === prompt.id ? (
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          spellCheck={false}
                          className="inline-block min-w-10 max-w-[280px] whitespace-nowrap px-1 text-[12px] font-medium cursor-text caret-current outline-none"
                          onBlur={(e) => {
                            savePromptTitle(prompt.id, e.currentTarget.textContent?.trim() || "Unnamed");
                            setEditingTitleId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              setEditingTitleId(null);
                            }
                          }}
                        >
                          {editingTitleValue}
                        </span>
                      ) : (
                        <span className="max-w-[280px] truncate whitespace-nowrap px-1 text-[12px] font-medium">
                          {prompt.title || "Unnamed"}
                        </span>
                      )}
                      <span className="truncate text-[11px] text-muted-foreground">
                        {getPromptPreview(prompt.content)}
                      </span>
                    </div>
                    <Button
                      size="xs"
                      variant={isCopied ? "secondary" : "outline"}
                      className={isCopied ? "border-success/45 bg-success/12 text-success hover:bg-success/18" : ""}
                      onClick={() => copyPrompt(prompt)}
                    >
                      {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {isCopied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      size="xs"
                      variant={isDeleteConfirm ? "secondary" : "ghost"}
                      className={isDeleteConfirm ? "text-destructive" : "text-muted-foreground hover:text-foreground"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDeleteConfirm) {
                          deletePrompt(prompt.id);
                          return;
                        }
                        setDeleteConfirmId(prompt.id);
                        setTimeout(() => {
                          setDeleteConfirmId((id) => (id === prompt.id ? null : id));
                        }, 1600);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      {isDeleteConfirm ? "Sure?" : null}
                    </Button>
                  </div>
                  {isExpanded ? (
                    <div className="border-t border-border px-2.5 pb-2.5 pt-2">
                      <Textarea
                        className="min-h-[140px] resize-y font-mono text-[13px]"
                        value={prompt.content}
                        onChange={(e) => savePrompt(prompt.id, e.target.value)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </ScrollAreaVanilla>
      </div>
    </main>
  );
}

export default App;
