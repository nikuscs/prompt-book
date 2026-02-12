import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Check, Copy, Expand } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Prompt = {
  id: string;
  title: string;
  content: string;
  copied: number;
  searched: number;
};

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
  const [mode, setMode] = useState<"raw" | "preview">("raw");
  const [windowLabel, setWindowLabel] = useState("main");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setWindowLabel(getCurrentWindow().label);
  }, []);

  const selectedPrompt = prompts.find((p) => p.id === selectedId) ?? prompts[0];
  const filteredPrompts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prompts;
    return prompts.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
  }, [prompts, search]);

  const savePrompt = (title: string, content: string) => {
    setPrompts((prev) =>
      prev.map((prompt) =>
        prompt.id === selectedPrompt.id
          ? {
              ...prompt,
              title,
              content,
            }
          : prompt,
      ),
    );
  };

  const copyPrompt = async (prompt = selectedPrompt) => {
    await navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    setPrompts((prev) => prev.map((p) => (p.id === prompt.id ? { ...p, copied: p.copied + 1 } : p)));
    setTimeout(() => setCopiedId((id) => (id === prompt.id ? null : id)), 1000);
  };

  const openMainWindow = async () => {
    await invoke("open_main_window");
  };

  if (windowLabel === "menubar") {
    return (
      <main className="h-screen w-screen overflow-hidden bg-transparent text-foreground">
        <div className="flex h-full w-full flex-col items-center bg-transparent p-3 pt-1.5">
          <div className="tray-arrow z-20 translate-y-1" />
          <div className="relative mt-1 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[24px] border border-white/14 bg-[#1c1f26] shadow-lg select-none">
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
                            ? "border-white/18 bg-white/8"
                            : "border-transparent bg-transparent hover:border-white/12 hover:bg-white/6"
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
    <main className="h-screen w-screen overflow-hidden bg-transparent p-3 text-foreground">
      <header
        className="mb-3 flex h-10 items-center justify-between rounded-xl border border-white/25 bg-card/70 px-3 backdrop-blur-xl dark:border-white/10"
        data-tauri-drag-region
      >
        <div className="text-sm font-semibold tracking-tight">PromptBook</div>
        <Badge variant="secondary">Menu-bar first</Badge>
      </header>

      <div className="grid h-[calc(100%-3.25rem)] grid-cols-12 gap-3">
        <Card className="col-span-12 flex h-full min-h-0 flex-col border-white/30 bg-card/75 backdrop-blur-xl md:col-span-4 lg:col-span-3 dark:border-white/10">
          <CardHeader className="space-y-3 pb-3">
            <CardTitle className="text-lg">Prompt Library</CardTitle>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prompts" />
          </CardHeader>
          <CardContent className="min-h-0 flex-1 pt-0">
            <ScrollArea className="h-full pr-2">
              <div className="space-y-2">
                {filteredPrompts.map((prompt) => {
                  const isSelected = prompt.id === selectedPrompt.id;
                  return (
                    <button
                      key={prompt.id}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isSelected ? "border-primary/30 bg-primary/8" : "border-border/60 hover:bg-secondary/70"
                      }`}
                      onClick={() => setSelectedId(prompt.id)}
                    >
                      <div className="font-medium">{prompt.title}</div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">Copied {prompt.copied}</Badge>
                        <Badge variant="secondary">Searched {prompt.searched}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-12 flex h-full min-h-0 flex-col border-white/30 bg-card/75 backdrop-blur-xl md:col-span-8 lg:col-span-9 dark:border-white/10">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Input
                value={selectedPrompt.title}
                onChange={(e) => savePrompt(e.target.value, selectedPrompt.content)}
                className="max-w-md"
              />
              <div className="flex items-center gap-2">
                <Tabs value={mode} onValueChange={(v) => setMode(v as "raw" | "preview")}>
                  <TabsList>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button variant="outline" onClick={() => openMainWindow()}>
                  Keep Open
                </Button>
                <Button onClick={() => copyPrompt()}>
                  <Copy className="size-4" />
                  Copy
                </Button>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="min-h-0 flex-1 pt-4">
            {mode === "raw" ? (
              <Textarea
                className="h-full min-h-0 resize-none font-mono text-[13px]"
                value={selectedPrompt.content}
                onChange={(e) => savePrompt(selectedPrompt.title, e.target.value)}
              />
            ) : (
              <ScrollArea className="h-full">
                <div className="whitespace-pre-wrap rounded-lg border bg-card/80 p-4 text-sm leading-6 backdrop-blur-md">
                  {selectedPrompt.content}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default App;
