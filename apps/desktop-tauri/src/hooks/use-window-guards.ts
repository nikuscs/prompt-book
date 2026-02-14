import { useEffect } from "react";

export function useWindowGuards(onSave: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isSave = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
      if (!isSave) return;
      event.preventDefault();
      const detail = { handled: false };
      window.dispatchEvent(new CustomEvent("promptbook:before-save", { detail }));
      if (detail.handled) return;
      onSave();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onSave]);

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const reload = key === "f5" || ((event.metaKey || event.ctrlKey) && key === "r");
      const inspect = key === "f12" || ((event.metaKey || event.ctrlKey) && event.altKey && key === "i");
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
}
