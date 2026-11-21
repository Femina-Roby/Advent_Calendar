"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import { DOOR_COUNT } from "./schema";

// The sender's work in progress. It autosaves in this browser (localStorage, with a memory fallback),
// so a refresh or a dropped connection never loses the 24 messages.
const KEY = "adv-maker-draft";

const doorDraft = z.object({
  body: z.string().max(600),
  link: z.string().max(2000),
  /** Photo reference (see lib/photo). Empty when the door has no photo. */
  photo: z.string().max(300).default(""),
  source: z.enum(["manual", "template"]),
});

const draftSchema = z.object({
  recipientName: z.string().max(80),
  title: z.string().max(120),
  closingNote: z.string().max(600),
  doors: z.array(doorDraft).length(DOOR_COUNT),
});

export type MakerDraft = z.infer<typeof draftSchema>;
export type DoorDraft = z.infer<typeof doorDraft>;

export const EMPTY_DRAFT: MakerDraft = {
  recipientName: "",
  title: "",
  closingNote: "",
  doors: Array.from({ length: DOOR_COUNT }, () => ({ body: "", link: "", photo: "", source: "manual" as const })),
};
const EMPTY_JSON = JSON.stringify(EMPTY_DRAFT);

let memory: string | null = null;
const listeners = new Set<() => void>();

function read(): string {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v) return v;
  } catch {
    /* storage unavailable */
  }
  return memory ?? EMPTY_JSON;
}

function write(json: string) {
  memory = json;
  try {
    window.localStorage.setItem(KEY, json);
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

export function parseDraft(json: string): MakerDraft {
  try {
    const r = draftSchema.safeParse(JSON.parse(json));
    return r.success ? r.data : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

export function useMakerDraft() {
  const raw = useSyncExternalStore(subscribe, read, () => EMPTY_JSON);
  const draft = useMemo(() => parseDraft(raw), [raw]);
  const update = useCallback((fn: (d: MakerDraft) => MakerDraft) => write(JSON.stringify(fn(parseDraft(read())))), []);
  const clear = useCallback(() => write(EMPTY_JSON), []);
  return { draft, update, clear };
}
