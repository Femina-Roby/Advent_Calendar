import { DOOR_COUNT } from "./schema";

export const storageKey = (slug: string) => `adv:${slug}`;

/** Clamp to an integer 0..24. Anything unusable becomes 0. */
export function clampProgress(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(DOOR_COUNT, Math.max(0, Math.trunc(n)));
}

export type TryOpen =
  | { ok: true; opened: number }
  | { ok: false; needed: number };

/**
 * Doors open strictly in order. Re-viewing an already opened door is always allowed.
 * `opened` is how many doors are open now; `n` is the door the user is trying.
 */
export function tryOpen(opened: number, n: number): TryOpen {
  const current = clampProgress(opened);
  if (!Number.isInteger(n) || n < 1 || n > DOOR_COUNT) return { ok: false, needed: current + 1 };
  if (n <= current) return { ok: true, opened: current };
  if (n === current + 1) return { ok: true, opened: n };
  return { ok: false, needed: Math.min(DOOR_COUNT, current + 1) };
}
