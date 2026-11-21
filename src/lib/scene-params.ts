import { DOOR_COUNT } from "./schema";

/**
 * The whole progression is this one pure function. The 3D scene reads these values from a single
 * progress number (0..24, fractional while tweening). No per-stage scenes.
 *
 * The story is a Kerala backwater night that slowly freezes: a starry, moonlit night with fireflies and warm
 * lanterns, then mist, then ice and snow, and a snowy blue-hour finale with every light glowing.
 */
export type Stage = "dusk" | "mist" | "ice" | "frozen" | "winter";

export type SceneParams = {
  stage: Stage;
  /** Hex colours. */
  waterColor: string;
  fogColor: string;
  skyTop: string;
  lightColor: string;
  lightIntensity: number;
  /** How strongly the sky image lights and reflects off everything. */
  envIntensity: number;
  fogDensity: number;
  /** 0..1 amounts. */
  mist: number;
  ice: number;
  roofSnow: number;
  treeGrowth: number;
  starAlpha: number;
  fireflies: number;
  /** Whole numbers. */
  snowCount: number;
  lanternCount: number;
  /** Finale: the star lantern is lit above the boat. */
  starLit: boolean;
};

type Key = Omit<SceneParams, "stage" | "starLit"> & { p: number };

/** Keyframes. Everything between two keys is smoothly interpolated. */
export const KEYFRAMES: readonly Key[] = [
  // 0 to 5: a calm starry night. Deep blue water, a bright moon, fireflies, warm lanterns.
  { p: 0, waterColor: "#173a5a", fogColor: "#16284a", skyTop: "#050a1c", lightColor: "#a8c0f0", lightIntensity: 0.55, envIntensity: 0.22, fogDensity: 0.01, mist: 0.2, ice: 0, roofSnow: 0, treeGrowth: 0, starAlpha: 1, fireflies: 1, snowCount: 0, lanternCount: 8 },
  // 6 to 11: cooler, mist on the water, the stars blur a little.
  { p: 6, waterColor: "#1b4663", fogColor: "#26405e", skyTop: "#0a1530", lightColor: "#9db6e0", lightIntensity: 0.55, envIntensity: 0.22, fogDensity: 0.016, mist: 0.6, ice: 0, roofSnow: 0, treeGrowth: 0, starAlpha: 0.85, fireflies: 0.8, snowCount: 0, lanternCount: 9 },
  // 11: holds ice, roof snow and snow at zero so nothing freezes before door 12.
  { p: 11, waterColor: "#235373", fogColor: "#35507a", skyTop: "#10204a", lightColor: "#a9c0e6", lightIntensity: 0.58, envIntensity: 0.24, fogDensity: 0.015, mist: 0.55, ice: 0, roofSnow: 0, treeGrowth: 0, starAlpha: 0.7, fireflies: 0.2, snowCount: 0, lanternCount: 10 },
  // 12 to 17: ice forms, first snow on the thatch.
  { p: 12, waterColor: "#2a5f82", fogColor: "#3d5a86", skyTop: "#142a5a", lightColor: "#b3c8ec", lightIntensity: 0.6, envIntensity: 0.26, fogDensity: 0.014, mist: 0.5, ice: 0.2, roofSnow: 0.3, treeGrowth: 0, starAlpha: 0.65, fireflies: 0, snowCount: 300, lanternCount: 11 },
  // 18 to 23: frozen solid, trees push through the ice, snow falling, more lights.
  { p: 18, waterColor: "#bcd9e8", fogColor: "#5d7aa8", skyTop: "#1d3a72", lightColor: "#c4d4f2", lightIntensity: 0.7, envIntensity: 0.3, fogDensity: 0.012, mist: 0.25, ice: 1, roofSnow: 0.75, treeGrowth: 0.15, starAlpha: 0.55, fireflies: 0, snowCount: 1200, lanternCount: 14 },
  // 24: a snowy blue-hour finale. Everything is lit.
  { p: 24, waterColor: "#e3f0f7", fogColor: "#8aa4cf", skyTop: "#2c4a86", lightColor: "#d6e0ff", lightIntensity: 0.85, envIntensity: 0.4, fogDensity: 0.013, mist: 0, ice: 1, roofSnow: 1, treeGrowth: 1, starAlpha: 0.45, fireflies: 0, snowCount: 2000, lanternCount: 18 },
];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const ch = (x: number, y: number) => Math.round(lerp(x, y, t)).toString(16).padStart(2, "0");
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`;
}

function stageOf(p: number): Stage {
  if (p >= DOOR_COUNT) return "winter";
  if (p >= 18) return "frozen";
  if (p >= 12) return "ice";
  if (p >= 6) return "mist";
  return "dusk";
}

/** progress: 0..24, fractional values are fine and give smooth in-between looks. */
export function sceneParams(progress: number): SceneParams {
  const p = Number.isFinite(progress) ? clamp(progress, 0, DOOR_COUNT) : 0;
  const i = Math.min(KEYFRAMES.length - 2, Math.max(0, KEYFRAMES.findLastIndex((k) => k.p <= p)));
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  const t = smooth(clamp((p - a.p) / (b.p - a.p), 0, 1));

  return {
    stage: stageOf(p),
    waterColor: lerpColor(a.waterColor, b.waterColor, t),
    fogColor: lerpColor(a.fogColor, b.fogColor, t),
    skyTop: lerpColor(a.skyTop, b.skyTop, t),
    lightColor: lerpColor(a.lightColor, b.lightColor, t),
    lightIntensity: lerp(a.lightIntensity, b.lightIntensity, t),
    envIntensity: lerp(a.envIntensity, b.envIntensity, t),
    fogDensity: lerp(a.fogDensity, b.fogDensity, t),
    mist: lerp(a.mist, b.mist, t),
    ice: lerp(a.ice, b.ice, t),
    roofSnow: lerp(a.roofSnow, b.roofSnow, t),
    treeGrowth: lerp(a.treeGrowth, b.treeGrowth, t),
    starAlpha: lerp(a.starAlpha, b.starAlpha, t),
    fireflies: lerp(a.fireflies, b.fireflies, t),
    snowCount: Math.round(lerp(a.snowCount, b.snowCount, t)),
    lanternCount: Math.round(lerp(a.lanternCount, b.lanternCount, t)),
    starLit: p >= DOOR_COUNT,
  };
}
