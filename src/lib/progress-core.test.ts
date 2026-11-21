import { describe, expect, it } from "vitest";
import { clampProgress, storageKey, tryOpen } from "./progress-core";

describe("clampProgress", () => {
  it("keeps valid values and clamps the rest", () => {
    expect(clampProgress(0)).toBe(0);
    expect(clampProgress(12)).toBe(12);
    expect(clampProgress(30)).toBe(24);
    expect(clampProgress(-4)).toBe(0);
    expect(clampProgress(7.9)).toBe(7);
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});

describe("tryOpen", () => {
  it("opens door 1 first", () => {
    expect(tryOpen(0, 1)).toEqual({ ok: true, opened: 1 });
  });

  it("refuses a door out of order and says which is needed", () => {
    expect(tryOpen(3, 5)).toEqual({ ok: false, needed: 4 });
    expect(tryOpen(0, 24)).toEqual({ ok: false, needed: 1 });
  });

  it("opens the next door in order", () => {
    expect(tryOpen(3, 4)).toEqual({ ok: true, opened: 4 });
  });

  it("allows re-viewing opened doors without changing progress", () => {
    expect(tryOpen(10, 2)).toEqual({ ok: true, opened: 10 });
    expect(tryOpen(10, 10)).toEqual({ ok: true, opened: 10 });
  });

  it("handles the finale and bad input", () => {
    expect(tryOpen(23, 24)).toEqual({ ok: true, opened: 24 });
    expect(tryOpen(24, 24)).toEqual({ ok: true, opened: 24 });
    expect(tryOpen(5, 0).ok).toBe(false);
    expect(tryOpen(5, 25).ok).toBe(false);
    expect(tryOpen(5, 2.5).ok).toBe(false);
  });
});

describe("storageKey", () => {
  it("is namespaced by slug", () => {
    expect(storageKey("abc")).toBe("adv:abc");
  });
});
