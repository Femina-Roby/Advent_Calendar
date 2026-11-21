"use client";

import { useCallback, useSyncExternalStore } from "react";

// The premade calendar asks whoever opens it for their name, so it can say "A calendar for ___".
// The name stays in this browser only.
const KEY = "adv-visitor-name";
let memory = "";
const listeners = new Set<() => void>();

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function write(value: string) {
  memory = value;
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* keep the memory copy */
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

export function useVisitorName() {
  const name = useSyncExternalStore(subscribe, read, () => "");
  const setName = useCallback((v: string) => write(v.slice(0, 40)), []);
  return [name, setName] as const;
}
