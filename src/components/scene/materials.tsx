"use client";

import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// PBR materials from the bundled Poly Haven (CC0) textures. Each use picks its own tiling;
// tiled clones are cached so 40 wall blocks share a handful of texture objects (and one GPU upload each).
const PATHS = {
  planks: [
    "/assets/tex/brown_planks_04_Diffuse.jpg",
    "/assets/tex/brown_planks_04_nor_gl.jpg",
    "/assets/tex/brown_planks_04_Rough.jpg",
  ],
  thatch: ["/assets/tex/reed_roof_03_Diffuse.jpg", "/assets/tex/reed_roof_03_Rough.jpg"],
  bamboo: ["/assets/tex/bamboo_wall_Diffuse.jpg"],
} as const;

const cache = new Map<string, THREE.Texture>();

function tiled(base: THREE.Texture, rx: number, ry: number) {
  const key = `${base.uuid}|${rx.toFixed(1)}|${ry.toFixed(1)}`;
  let t = cache.get(key);
  if (!t) {
    t = base.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = 4;
    t.needsUpdate = true;
    cache.set(key, t);
  }
  return t;
}

type Repeat = readonly [number, number];
type Props = { repeat?: Repeat; color?: string };

export function Planks({ repeat = [1, 1], color = "#ffffff" }: Props) {
  const [d, n, r] = useTexture([...PATHS.planks]);
  return (
    <meshStandardMaterial
      color={color}
      map={tiled(d, repeat[0], repeat[1])}
      normalMap={tiled(n, repeat[0], repeat[1])}
      roughnessMap={tiled(r, repeat[0], repeat[1])}
      roughness={1}
    />
  );
}

export function Thatch({ repeat = [1, 1], color = "#ffffff" }: Props) {
  const [d, r] = useTexture([...PATHS.thatch]);
  return (
    <meshStandardMaterial
      color={color}
      map={tiled(d, repeat[0], repeat[1])}
      roughnessMap={tiled(r, repeat[0], repeat[1])}
      roughness={1}
      side={THREE.DoubleSide}
    />
  );
}

export function Bamboo({ repeat = [1, 1], color = "#ffffff" }: Props) {
  const [d] = useTexture([...PATHS.bamboo]);
  return <meshStandardMaterial color={color} map={tiled(d, repeat[0], repeat[1])} roughness={0.8} />;
}
