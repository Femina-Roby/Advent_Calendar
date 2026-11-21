import { describe, expect, it } from "vitest";
import { KEYFRAMES, sceneParams, type SceneParams } from "./scene-params";

const HEX = /^#[0-9a-f]{6}$/;

describe("sceneParams keyframes", () => {
  it("returns exactly the table values at each keyframe", () => {
    for (const k of KEYFRAMES) {
      const s = sceneParams(k.p);
      expect(s.waterColor).toBe(k.waterColor);
      expect(s.fogColor).toBe(k.fogColor);
      expect(s.skyTop).toBe(k.skyTop);
      expect(s.lightColor).toBe(k.lightColor);
      expect(s.fogDensity).toBeCloseTo(k.fogDensity, 6);
      expect(s.mist).toBeCloseTo(k.mist, 6);
      expect(s.ice).toBeCloseTo(k.ice, 6);
      expect(s.roofSnow).toBeCloseTo(k.roofSnow, 6);
      expect(s.treeGrowth).toBeCloseTo(k.treeGrowth, 6);
      expect(s.snowCount).toBe(k.snowCount);
      expect(s.lanternCount).toBe(k.lanternCount);
      expect(s.starAlpha).toBeCloseTo(k.starAlpha, 6);
      expect(s.envIntensity).toBeCloseTo(k.envIntensity, 6);
      expect(s.fireflies).toBeCloseTo(k.fireflies, 6);
    }
  });
});

describe("sceneParams story", () => {
  it("opens on a starry night with fireflies and no snow or ice", () => {
    const s = sceneParams(0);
    expect(s.stage).toBe("dusk");
    expect(s.starAlpha).toBeGreaterThan(0.9);
    expect(s.fireflies).toBeGreaterThan(0.9);
    expect(s.snowCount).toBe(0);
    expect(s.ice).toBe(0);
    expect(s.starLit).toBe(false);
  });

  it("has mist but no ice at door 8", () => {
    const s = sceneParams(8);
    expect(s.stage).toBe("mist");
    expect(s.mist).toBeGreaterThan(0.3);
    expect(s.ice).toBe(0);
    expect(s.roofSnow).toBe(0);
    expect(s.snowCount).toBe(0);
    expect(sceneParams(11).ice).toBe(0);
  });

  it("starts ice and roof snow in the 12 to 17 band", () => {
    const s = sceneParams(15);
    expect(s.stage).toBe("ice");
    expect(s.ice).toBeGreaterThan(0);
    expect(s.ice).toBeLessThan(1);
    expect(s.roofSnow).toBeGreaterThan(0);
  });

  it("is frozen solid with trees growing in the 18 to 23 band", () => {
    const s = sceneParams(21);
    expect(s.stage).toBe("frozen");
    expect(s.ice).toBe(1);
    expect(s.treeGrowth).toBeGreaterThan(0);
    expect(s.snowCount).toBeGreaterThan(sceneParams(12).snowCount);
  });

  it("is full winter with the star lit at 24, and the fireflies gone", () => {
    const s = sceneParams(24);
    expect(s.stage).toBe("winter");
    expect(s.fireflies).toBe(0);
    expect(s.starLit).toBe(true);
    expect(s.treeGrowth).toBe(1);
  });

  it("stage changes exactly at 6, 12, 18 and 24", () => {
    expect([5.99, 6, 11.99, 12, 17.99, 18, 23.99, 24].map((p) => sceneParams(p).stage)).toEqual([
      "dusk", "mist", "mist", "ice", "ice", "frozen", "frozen", "winter",
    ]);
  });
});

describe("sceneParams safety", () => {
  it("clamps out-of-range and bad input", () => {
    expect(sceneParams(-5)).toEqual(sceneParams(0));
    expect(sceneParams(99)).toEqual(sceneParams(24));
    expect(sceneParams(Number.NaN)).toEqual(sceneParams(0));
  });

  it("always returns valid colours and whole-number counts", () => {
    for (let p = 0; p <= 24; p += 0.5) {
      const s = sceneParams(p);
      expect(s.waterColor).toMatch(HEX);
      expect(s.fogColor).toMatch(HEX);
      expect(s.skyTop).toMatch(HEX);
      expect(s.lightColor).toMatch(HEX);
      expect(Number.isInteger(s.snowCount)).toBe(true);
      expect(Number.isInteger(s.lanternCount)).toBe(true);
      for (const v of [s.starAlpha, s.fireflies, s.envIntensity]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("never goes backwards for the amounts that only grow", () => {
    const keys: (keyof SceneParams)[] = ["ice", "roofSnow", "treeGrowth", "lanternCount"];
    let prev = sceneParams(0);
    for (let p = 0.25; p <= 24; p += 0.25) {
      const cur = sceneParams(p);
      for (const k of keys) expect(cur[k] as number).toBeGreaterThanOrEqual(prev[k] as number);
      prev = cur;
    }
  });
});
