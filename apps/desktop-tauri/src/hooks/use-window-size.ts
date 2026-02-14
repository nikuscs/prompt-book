import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { RefObject, useEffect, useRef } from "react";
import {
  WINDOW_MAIN_MAX_HEIGHT,
  WINDOW_MAIN_MIN_HEIGHT,
  WINDOW_MAIN_WIDTH,
  WINDOW_MENUBAR_LIST_MAX_HEIGHT,
  WINDOW_MENUBAR_LIST_MIN_HEIGHT,
  WINDOW_MENUBAR_MAX_HEIGHT,
  WINDOW_MENUBAR_MIN_HEIGHT,
  WINDOW_MENUBAR_WIDTH,
} from "@/lib/constants";

export function useWindowMainSize({
  enabled,
  contentRef,
  deps,
}: {
  enabled: boolean;
  contentRef: RefObject<HTMLDivElement | null>;
  deps: unknown[];
}) {
  useEffect(() => {
    if (!enabled) return;
    const window = getCurrentWindow();
    const resizeToContent = () => {
      const content = contentRef.current;
      if (!content) return;
      const desiredHeight = Math.ceil(content.scrollHeight + 18);
      const nextHeight = Math.min(WINDOW_MAIN_MAX_HEIGHT, Math.max(WINDOW_MAIN_MIN_HEIGHT, desiredHeight));
      void window.setSize(new LogicalSize(WINDOW_MAIN_WIDTH, nextHeight));
    };

    const timer = setTimeout(resizeToContent, 20);
    const observer = new ResizeObserver(() => resizeToContent());
    if (contentRef.current) observer.observe(contentRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled, contentRef, ...deps]);
}

export function useWindowMenubarSize({
  enabled,
  contentRef,
  headerRef,
  listInnerRef,
  deps,
}: {
  enabled: boolean;
  contentRef: RefObject<HTMLDivElement | null>;
  headerRef: RefObject<HTMLDivElement | null>;
  listInnerRef: RefObject<HTMLDivElement | null>;
  deps: unknown[];
}) {
  const lastHeightRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const window = getCurrentWindow();
    const resizeToContent = () => {
      const header = headerRef.current;
      const listInner = listInnerRef.current;
      if (!header || !listInner) return;

      const naturalListHeight = Math.ceil(listInner.scrollHeight);
      const clampedListHeight = Math.min(WINDOW_MENUBAR_LIST_MAX_HEIGHT, Math.max(WINDOW_MENUBAR_LIST_MIN_HEIGHT, naturalListHeight));

      // pt-1.5(6) + arrow(7) + mt-1(4) + border(2) + list-pb-2.5(10) + p-3 bottom(12) = 41
      const desiredHeight = Math.ceil(header.offsetHeight + clampedListHeight + 41);
      const nextHeight = Math.min(WINDOW_MENUBAR_MAX_HEIGHT, Math.max(WINDOW_MENUBAR_MIN_HEIGHT, desiredHeight));
      if (Math.abs(nextHeight - lastHeightRef.current) <= 1) return;

      lastHeightRef.current = nextHeight;
      void window.setSize(new LogicalSize(WINDOW_MENUBAR_WIDTH, nextHeight));
    };

    const timer = setTimeout(resizeToContent, 20);
    const observer = new ResizeObserver(() => resizeToContent());
    if (contentRef.current) observer.observe(contentRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled, contentRef, headerRef, listInnerRef, ...deps]);
}
