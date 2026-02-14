import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useCallback, useEffect, useRef, useState } from "react";

type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [version, setVersion] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const checkedRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    try {
      setStatus("checking");
      const update = await check();
      if (!update) {
        setStatus("idle");
        return;
      }
      setVersion(update.version);
      setStatus("available");
    } catch {
      setStatus("error");
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    try {
      setStatus("checking");
      const update = await check();
      if (!update) {
        setStatus("idle");
        return;
      }
      setStatus("downloading");
      let totalLen = 0;
      let downloaded = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data.contentLength) {
          totalLen = event.data.contentLength;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (totalLen > 0) setProgress(Math.round((downloaded / totalLen) * 100));
        } else if (event.event === "Finished") {
          setStatus("ready");
        }
      });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  const restartApp = useCallback(async () => {
    await relaunch();
  }, []);

  // Check on mount + periodically
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    // Delay initial check to not slow down startup
    const initial = setTimeout(() => void checkForUpdate(), 3000);
    const interval = setInterval(() => void checkForUpdate(), CHECK_INTERVAL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [checkForUpdate]);

  return { status, version, progress, checkForUpdate, downloadAndInstall, restartApp };
}
