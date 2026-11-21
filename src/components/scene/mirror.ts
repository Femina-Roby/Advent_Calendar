import type { Object3D } from "three";

/** Objects hidden while the water renders its mirror image (number tags would show up as ghosts). */
export const noMirror = new Set<Object3D>();
