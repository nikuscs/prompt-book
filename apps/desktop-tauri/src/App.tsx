import { useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(selectedPrompt.content);
    setPrompts((prev) => prev.map((p) => (p.id === selectedPrompt.id ? { ...p, copied: p.copied + 1 } : p)));
  };

  const checkRustBridge = async () => {
    const result = await invoke<string>("ping");
    console.log("Rust bridge:", result);
  };

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">
        <Card className="col-span-12 md:col-span-4 lg:col-span-3">
          <CardHeader className="space-y-3 pb-3">
            <CardTitle className="text-lg">PromptBook</CardTitle>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prompts" />
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[540px] pr-2">
              <div className="space-y-2">
                {filteredPrompts.map((prompt) => {
                  const isSelected = prompt.id === selectedPrompt.id;
                  return (
                    <button
                      key={prompt.id}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-secondary/60"
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

        <Card className="col-span-12 md:col-span-8 lg:col-span-9">
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
                <Button variant="secondary" onClick={checkRustBridge}>
                  Ping Rust
                </Button>
                <Button onClick={copyPrompt}>Copy</Button>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {mode === "raw" ? (
              <Textarea
                className="min-h-[500px] font-mono text-[13px]"
                value={selectedPrompt.content}
                onChange={(e) => savePrompt(selectedPrompt.title, e.target.value)}
              />
            ) : (
              <div className="min-h-[500px] whitespace-pre-wrap rounded-lg border bg-card p-4 text-sm leading-6">
                {selectedPrompt.content}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default App;
