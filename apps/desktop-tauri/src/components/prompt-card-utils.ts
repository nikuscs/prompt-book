export function getPromptPreview(content: string): string {
  return content
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasSelectedText(target: EventTarget | null): boolean {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (start !== null && end !== null && start !== end) {
      return true;
    }
  }

  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString().length > 0);
}
