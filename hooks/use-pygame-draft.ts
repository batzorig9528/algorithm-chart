"use client";

import { useEffect, useRef, useState } from "react";
import { LIGHT_EXAMPLE } from "@/lib/light-examples";

export const PYGAME_DRAFT_KEY = "flow-pygame-draft-v1";

export function usePygameDraft() {
  const [code, setCode] = useState(LIGHT_EXAMPLE);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const latest = useRef(LIGHT_EXAMPLE);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function save() {
    if (!dirty.current) return;
    try {
      localStorage.setItem(PYGAME_DRAFT_KEY, latest.current);
      dirty.current = false;
      setStorageError(false);
    } catch { setStorageError(true); }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PYGAME_DRAFT_KEY);
      if (saved !== null) { latest.current = saved; setCode(saved); }
    } catch { setStorageError(true); }
    setReady(true);
    const flush = () => save();
    const onHidden = () => { if (document.visibilityState === "hidden") save(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
      // Flush the latest edit even when navigation beats the debounce.
      if (dirty.current) {
        try { localStorage.setItem(PYGAME_DRAFT_KEY, latest.current); } catch { /* Download remains available. */ }
      }
    };
  }, []);

  function changeCode(value: string) {
    latest.current = value;
    dirty.current = true;
    setCode(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(save, 350);
  }
  return { code, setCode: changeCode, ready, storageError };
}
