"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DOOR_COUNT } from "./schema";
import { clampProgress, storageKey } from "./progress-core";

// Falls back to memory when localStorage is blocked (private windows, strict settings).
const memory = new Map<string, number>();
const listeners = new Set<() => void>();

function read(slug: string): number {
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (raw !== null) return clampProgress(Number.parseInt(raw, 10));
  } catch {
    /* storage unavailable, use memory */
  }
  return memory.get(slug) ?? 0;
}

function write(slug: string, value: number) {
  const v = clampProgress(value);
  memory.set(slug, v);
  try {
    window.localStorage.setItem(storageKey(slug), String(v));
  } catch {
    /* ignore, memory copy is kept */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Number of doors opened (0..24) for this calendar. `ready` is false until the browser has read storage. */
export function useProgress(slug: string) {
  const opened = useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => -1,
  );
  const advance = useCallback((n: number) => write(slug, Math.max(read(slug), n)), [slug]);
  const reset = useCallback(() => write(slug, 0), [slug]);
  return { opened: Math.max(opened, 0), ready: opened >= 0, finished: opened >= DOOR_COUNT, advance, reset };
}
