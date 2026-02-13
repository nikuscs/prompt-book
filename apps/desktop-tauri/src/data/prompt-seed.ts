import type { Prompt } from "@/types/prompt";

export const promptSeed: Prompt[] = [
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
