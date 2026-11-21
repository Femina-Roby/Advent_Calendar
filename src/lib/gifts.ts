import { DECK_Y, RIDGE_Y, UP_Y, UP_X0 } from "./boat-dims";

export type Vec3 = readonly [number, number, number];

/** Every gift is a different object that opens in its own way. */
export type GiftKind =
  | "door"
  | "shutters"
  | "teapot"
  | "lantern"
  | "chest"
  | "lifebuoy"
  | "blind"
  | "letterbox"
  | "hatch"
  | "pot"
  | "basket"
  | "drop"
  | "sash"
  | "curtain"
  | "drawer"
  | "flapdown"
  | "binnacle"
  | "trapdoor"
  | "doubledoor"
  | "slider"
  | "coconut"
  | "canoe"
  | "bottle"
  | "star";

export type GiftSpec = {
  kind: GiftKind;
  /** Plain-language name, used for accessibility text. */
  label: string;
  /** Anchor position in the scene. */
  pos: Vec3;
  /** Rotation about the vertical axis, so the object faces outward from its wall. */
  rotY: number;
  /** Height of the number tag above the anchor. */
  tagY: number;
  /** Centre height and radius of the invisible click area. */
  hy: number;
  hr: number;
  /** Where the wrapped present appears once opened, relative to the anchor (+z points outward). */
  rv: Vec3;
};

const F = -Math.PI / 2; // faces the bow
const A = Math.PI / 2; // faces the stern
const P = Math.PI; // faces port

/**
 * The 24 gifts in door order. The walk goes round the boat, so rotating it reveals the next gift:
 * bow deck, starboard wall, stern and kitchen, port wall, the upper deck and roof, then the water.
 */
export const GIFTS: readonly GiftSpec[] = [
  { kind: "door", label: "Front door", pos: [-3.0, DECK_Y, 0], rotY: F, tagY: 1.95, hy: 0.75, hr: 0.8, rv: [0, 0.5, 0.8] },
  { kind: "shutters", label: "Window shutters", pos: [-2.0, 2.06, 1.3], rotY: 0, tagY: 0.7, hy: 0, hr: 0.5, rv: [0, 0, 0.8] },
  { kind: "teapot", label: "Brass teapot", pos: [-4.4, DECK_Y + 0.525, 0], rotY: 0, tagY: 0.7, hy: 0.15, hr: 0.35, rv: [0, 0.6, 0] },
  { kind: "lantern", label: "Hanging lantern", pos: [-6.0, DECK_Y + 0.9, 0.5], rotY: 0, tagY: 0.6, hy: -0.2, hr: 0.4, rv: [0.22, 0.4, 0] },
  { kind: "chest", label: "Wooden chest", pos: [-5.6, DECK_Y, -0.7], rotY: -0.5, tagY: 1.0, hy: 0.25, hr: 0.5, rv: [0, 0.75, 0] },
  { kind: "lifebuoy", label: "Lifebuoy", pos: [0.475, 2.06, 1.345], rotY: 0, tagY: 0.8, hy: 0, hr: 0.4, rv: [0, 0, 0.8] },
  { kind: "blind", label: "Bamboo blind", pos: [-0.35, 2.06, 1.3], rotY: 0, tagY: 0.5, hy: 0, hr: 0.45, rv: [0, 0, 0.8] },
  { kind: "letterbox", label: "Letter box", pos: [2.15, 1.95, 1.345], rotY: 0, tagY: 0.5, hy: 0, hr: 0.3, rv: [0, 0, 0.7] },
  { kind: "hatch", label: "Kitchen hatch", pos: [2.6, 2.05, 0], rotY: A, tagY: 0.65, hy: 0, hr: 0.6, rv: [0, -0.1, 0.85] },
  { kind: "pot", label: "Brass pot", pos: [3.5, DECK_Y + 0.6, -0.65], rotY: 0, tagY: 0.85, hy: 0.2, hr: 0.35, rv: [0, 0.75, 0] },
  { kind: "basket", label: "Woven basket", pos: [4.2, DECK_Y, 0.7], rotY: 0, tagY: 1.0, hy: 0.25, hr: 0.4, rv: [0, 0.85, 0] },
  { kind: "drop", label: "Hanging net bundle", pos: [6.0, DECK_Y + 0.9, 0.5], rotY: 0, tagY: 0.4, hy: -0.4, hr: 0.45, rv: [0, -0.45, 0.45] },
  { kind: "sash", label: "Sliding window", pos: [1.3, 2.06, -1.3], rotY: P, tagY: 0.7, hy: 0, hr: 0.5, rv: [0, 0, 0.8] },
  { kind: "curtain", label: "Window curtain", pos: [-0.35, 2.06, -1.3], rotY: P, tagY: 0.7, hy: 0, hr: 0.5, rv: [0, 0, 0.8] },
  { kind: "drawer", label: "Drawer", pos: [-1.2, 1.4, -1.345], rotY: P, tagY: 0.45, hy: 0, hr: 0.4, rv: [0, 0.35, 0.8] },
  { kind: "flapdown", label: "Folding shelf", pos: [-2.0, 2.06, -1.3], rotY: P, tagY: 0.7, hy: 0, hr: 0.5, rv: [0, 0.1, 0.8] },
  { kind: "binnacle", label: "Brass compass", pos: [-3.15, UP_Y + 0.75, 0.3], rotY: 0, tagY: 0.55, hy: 0.15, hr: 0.3, rv: [0, 0.6, 0] },
  { kind: "trapdoor", label: "Deck trapdoor", pos: [-1.95, UP_Y, -0.85], rotY: 0, tagY: 0.65, hy: 0.05, hr: 0.5, rv: [0, 0.8, 0] },
  { kind: "doubledoor", label: "Upper cabin doors", pos: [UP_X0, UP_Y, 0], rotY: F, tagY: 1.5, hy: 0.5, hr: 0.7, rv: [0, 0.5, 0.8] },
  { kind: "slider", label: "Sliding shutter", pos: [0.0, 3.675, 1.1], rotY: 0, tagY: 0.6, hy: 0, hr: 0.45, rv: [0, 0, 0.8] },
  { kind: "coconut", label: "Coconut", pos: [-0.6, RIDGE_Y, 0], rotY: 0, tagY: 0.8, hy: 0.17, hr: 0.35, rv: [0, 0.75, 0] },
  { kind: "canoe", label: "Little canoe", pos: [-2.0, 0.6, 3.9], rotY: 0.5, tagY: 1.0, hy: 0.25, hr: 0.9, rv: [0, 0.95, 0] },
  { kind: "bottle", label: "Message bottle", pos: [2.6, 0.62, -3.9], rotY: 0.8, tagY: 0.55, hy: 0.1, hr: 0.4, rv: [0, 0.65, 0] },
  { kind: "star", label: "Paper star lantern", pos: [1.1, RIDGE_Y, 0], rotY: 0, tagY: 0.9, hy: 0.2, hr: 0.4, rv: [0, 0.8, 0] },
];

/** What happens when each object opens, in plain words. Shown to the sender while they fill it in. */
export const GIFT_OPENS: Record<GiftKind, string> = {
  door: "swings open",
  shutters: "swing open",
  teapot: "the lid lifts",
  lantern: "its little door opens",
  chest: "the lid lifts",
  lifebuoy: "swings down",
  blind: "rolls up",
  letterbox: "the flap opens",
  hatch: "the hatch lifts",
  pot: "the lid lifts off",
  basket: "the lid slides off",
  drop: "drops down on its rope",
  sash: "slides up",
  curtain: "draws back",
  drawer: "slides out",
  flapdown: "folds down into a shelf",
  binnacle: "the glass dome lifts",
  trapdoor: "swings up",
  doubledoor: "swing open",
  slider: "slides aside",
  coconut: "its top pops off",
  canoe: "the crate lid lifts",
  bottle: "the cork pops",
  star: "unfolds and glows",
};
