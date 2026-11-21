"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { WATER_Y } from "@/lib/boat-dims";
import { starGeometry } from "./Decor";
import { seeded } from "./Weather";

// Christmas trees scattered at random over the whole frozen scene: clumps and loners, tall spruces and wide
// firs, each leaning a little. Every tree is green and dressed with coloured lights AND shiny baubles, with a
// light dusting of snow on the boughs and a golden star on the biggest. Everything is instanced, so ~110
// decorated trees cost about a dozen draw calls.
const COUNT = 110;
const LIGHTS_PER_TREE = 14;
const ORNAMENTS_PER_TREE = 7;
const STAR_TREES = 18;
/** Ice stays clear this far from the boat so the camera can always see every gift. */
const CLEARING = 13;

const TIERS = [
  { r: 1.25, h: 1.7, c: 1.35 },
  { r: 1.0, h: 1.5, c: 2.25 },
  { r: 0.75, h: 1.3, c: 3.05 },
  { r: 0.5, h: 1.1, c: 3.75 },
] as const;

const LIGHT_COLORS = ["#ff5a4a", "#ffd27a", "#fff3d0", "#6ab7ff", "#ffd27a", "#ff8a3c", "#9dff9a"];
const ORNAMENT_COLORS = ["#c0392b", "#d9b24f", "#2f6bbf", "#e8e0d0", "#c0392b", "#d9b24f"];

type Tree = {
  x: number;
  z: number;
  s: number;
  w: number;
  h: number;
  rot: number;
  leanX: number;
  leanZ: number;
  /** Growth value at which this tree starts rising through the ice. */
  thr: number;
  color: THREE.Color;
};

type Deco = { tree: number; tier: number; angle: number; f: number; color: THREE.Color };

function makeForest() {
  const rnd = seeded(31);
  const trees: Tree[] = [];
  let tries = 0;
  while (trees.length < COUNT && tries < 9000) {
    tries++;
    let x: number;
    let z: number;
    if (trees.length > 3 && rnd() < 0.45) {
      // Clump: grow near an existing tree.
      const p = trees[Math.floor(rnd() * trees.length)];
      x = p.x + (rnd() - 0.5) * 7;
      z = p.z + (rnd() - 0.5) * 7;
    } else {
      const r = CLEARING + Math.pow(rnd(), 0.85) * (66 - CLEARING);
      const a = rnd() * Math.PI * 2;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
    }
    const d = Math.hypot(x, z);
    if (d > 66 || d < CLEARING) continue;
    const kind = rnd();
    const s = (0.55 + rnd() * 1.05) * (1 + d / 70);
    const w = kind < 0.25 ? 0.7 : kind < 0.7 ? 1.0 : 1.2;
    const h = kind < 0.25 ? 1.35 : kind < 0.7 ? 1.0 : 0.85;
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 1.4 * (t.s * t.w + s * w))) continue;
    trees.push({
      x,
      z,
      s,
      w,
      h,
      rot: rnd() * Math.PI * 2,
      leanX: (rnd() - 0.5) * 0.12,
      leanZ: (rnd() - 0.5) * 0.12,
      thr: rnd() * 0.8,
      // Fresh Christmas-tree greens, never near-black.
      color: new THREE.Color("#2d8a55").lerp(new THREE.Color("#52b377"), rnd()),
    });
  }
  const deco = (perTree: number, palette: string[], fMin: number, fSpan: number): Deco[] => {
    const out: Deco[] = [];
    trees.forEach((_, tree) => {
      for (let i = 0; i < perTree; i++) {
        out.push({
          tree,
          tier: Math.floor(rnd() * TIERS.length),
          angle: rnd() * Math.PI * 2,
          f: fMin + rnd() * fSpan,
          color: new THREE.Color(palette[Math.floor(rnd() * palette.length)]),
        });
      }
    });
    return out;
  };
  const lights = deco(LIGHTS_PER_TREE, LIGHT_COLORS, 0.1, 0.78);
  const ornaments = deco(ORNAMENTS_PER_TREE, ORNAMENT_COLORS, 0.08, 0.7);
  // The tallest trees get a star.
  const starTrees = trees
    .map((t, i) => ({ i, tall: t.s * t.h }))
    .sort((a, b) => b.tall - a.tall)
    .slice(0, STAR_TREES)
    .map((e) => e.i);
  return { trees, lights, ornaments, starTrees };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

type InstRef = (THREE.InstancedMesh | null)[];

export function Forest({ growth, snow }: { growth: number; snow: number }) {
  const { trees, lights, ornaments, starTrees } = useMemo(() => makeForest(), []);
  const cones = useRef<InstRef>([]);
  const caps = useRef<InstRef>([]);
  const trunk = useRef<THREE.InstancedMesh>(null);
  const lightMesh = useRef<THREE.InstancedMesh>(null);
  const ornMesh = useRef<THREE.InstancedMesh>(null);
  const starMesh = useRef<THREE.InstancedMesh>(null);
  const starGeo = useMemo(() => starGeometry(), []);

  // Colours never change: set once.
  useLayoutEffect(() => {
    cones.current.forEach((m) => {
      if (!m) return;
      trees.forEach((t, i) => m.setColorAt(i, t.color));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    for (const [mesh, list] of [
      [lightMesh.current, lights],
      [ornMesh.current, ornaments],
    ] as const) {
      if (!mesh) continue;
      list.forEach((d, i) => mesh.setColorAt(i, d.color));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [trees, lights, ornaments]);

  // Transforms follow the freeze: each tree rises through the ice at its own moment, snow dusts the boughs.
  useLayoutEffect(() => {
    const tree = new THREE.Matrix4();
    const local = new THREE.Matrix4();
    const out = new THREE.Matrix4();
    const obj = new THREE.Object3D();
    const q = new THREE.Quaternion();
    const sn = clamp01(snow);

    const treeMatrix = (t: Tree) => {
      const g = clamp01((growth - t.thr) / 0.2);
      obj.position.set(t.x, WATER_Y + 0.02, t.z);
      obj.rotation.set(t.leanX, t.rot, t.leanZ);
      obj.scale.set(t.s * t.w * Math.min(1, g * 3), t.s * t.h * g, t.s * t.w * Math.min(1, g * 3));
      obj.updateMatrix();
      return obj.matrix;
    };

    trees.forEach((t, i) => {
      tree.copy(treeMatrix(t));
      local.compose(new THREE.Vector3(0, 0.35, 0), q, new THREE.Vector3(0.14, 0.7, 0.14));
      trunk.current?.setMatrixAt(i, out.multiplyMatrices(tree, local));
      TIERS.forEach((tier, k) => {
        local.compose(new THREE.Vector3(0, tier.c, 0), q, new THREE.Vector3(tier.r, tier.h, tier.r));
        cones.current[k]?.setMatrixAt(i, out.multiplyMatrices(tree, local));
        // A light dusting of snow near each tier's tip, so the green still reads.
        local.compose(
          new THREE.Vector3(0, tier.c + tier.h * 0.3, 0),
          q,
          new THREE.Vector3(tier.r * 0.7 * sn, tier.h * 0.4 * sn, tier.r * 0.7 * sn),
        );
        caps.current[k]?.setMatrixAt(i, out.multiplyMatrices(tree, local));
      });
    });

    const place = (mesh: THREE.InstancedMesh | null, list: Deco[], size: number, outward: number) => {
      list.forEach((d, i) => {
        tree.copy(treeMatrix(trees[d.tree]));
        const tier = TIERS[d.tier];
        const rad = tier.r * (1 - d.f) * outward;
        local.compose(
          new THREE.Vector3(Math.cos(d.angle) * rad, tier.c - tier.h / 2 + d.f * tier.h, Math.sin(d.angle) * rad),
          q,
          new THREE.Vector3(size, size, size),
        );
        mesh?.setMatrixAt(i, out.multiplyMatrices(tree, local));
      });
    };
    place(lightMesh.current, lights, 0.09, 1.05);
    place(ornMesh.current, ornaments, 0.14, 1.02);

    starTrees.forEach((ti, i) => {
      tree.copy(treeMatrix(trees[ti]));
      local.compose(new THREE.Vector3(0, 4.45, 0), q, new THREE.Vector3(0.36, 0.36, 0.36));
      starMesh.current?.setMatrixAt(i, out.multiplyMatrices(tree, local));
    });

    [trunk.current, lightMesh.current, ornMesh.current, starMesh.current, ...cones.current, ...caps.current].forEach((m) => {
      if (m) m.instanceMatrix.needsUpdate = true;
    });
  }, [growth, snow, trees, lights, ornaments, starTrees]);

  return (
    <group visible={growth > 0.005}>
      <instancedMesh ref={trunk} args={[undefined, undefined, trees.length]} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#5a3f27" roughness={1} />
      </instancedMesh>
      {TIERS.map((_, k) => (
        <instancedMesh
          key={`c${k}`}
          ref={(m) => {
            cones.current[k] = m;
          }}
          args={[undefined, undefined, trees.length]}
          frustumCulled={false}
        >
          <coneGeometry args={[1, 1, 7]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} flatShading />
        </instancedMesh>
      ))}
      {TIERS.map((_, k) => (
        <instancedMesh
          key={`s${k}`}
          ref={(m) => {
            caps.current[k] = m;
          }}
          args={[undefined, undefined, trees.length]}
          frustumCulled={false}
        >
          <coneGeometry args={[1, 1, 7]} />
          <meshStandardMaterial color="#f4f8fb" roughness={1} flatShading />
        </instancedMesh>
      ))}
      {/* Glowing fairy lights. */}
      <instancedMesh ref={lightMesh} args={[undefined, undefined, lights.length]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
      {/* Shiny baubles. */}
      <instancedMesh ref={ornMesh} args={[undefined, undefined, ornaments.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#ffffff" metalness={0.7} roughness={0.25} />
      </instancedMesh>
      <instancedMesh ref={starMesh} args={[starGeo, undefined, starTrees.length]} frustumCulled={false}>
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

// ---- The far shore: Alappuzha is flat. A low bank of coconut palms and village lights, no hills. ----
const PALMS = 150;
const FRONDS = 8;
const VILLAGE_LIGHTS = 140;

/** Irregular inner edge of the bank, in metres from the boat. */
const shoreInner = (a: number) => 84 + 6 * Math.sin(3 * a + 1) + 4 * Math.sin(7 * a + 2);

function frondGeometry() {
  const g = new THREE.ConeGeometry(0.42, 3.8, 4);
  g.rotateX(Math.PI / 2); // lie along +z, tip outward
  g.translate(0, 0, 1.9);
  return g;
}

function makeShore() {
  const rnd = seeded(9);
  const palms = Array.from({ length: PALMS }, () => {
    const a = rnd() * Math.PI * 2;
    // Clustered: palms group into little groves.
    const r = shoreInner(a) + 1 + Math.pow(rnd(), 1.6) * 30;
    return {
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      h: 7 + rnd() * 6,
      lean: (rnd() - 0.5) * 0.35,
      rot: rnd() * Math.PI * 2,
      fronds: Array.from({ length: FRONDS }, (_, i) => ({ a: (i / FRONDS) * Math.PI * 2 + rnd() * 0.5, droop: 0.35 + rnd() * 0.6 })),
    };
  });
  const lights = Array.from({ length: VILLAGE_LIGHTS }, () => {
    const a = rnd() * Math.PI * 2;
    const r = shoreInner(a) + 2 + rnd() * 22;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: 0.5 + rnd() * 1.4 };
  });
  const bulbs = palms.flatMap((_, pi) =>
    Array.from({ length: 6 }, () => ({
      pi,
      a: rnd() * Math.PI * 2,
      r: 0.5 + rnd() * 1.1,
      y: -0.5 + rnd() * 0.9,
      c: new THREE.Color(LIGHT_COLORS[Math.floor(rnd() * LIGHT_COLORS.length)]),
    })),
  );
  // Land: a ring with an irregular inner edge.
  const seg = 160;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const ri = shoreInner(a);
    pos.push(Math.cos(a) * ri, 0, Math.sin(a) * ri, Math.cos(a) * 200, 0, Math.sin(a) * 200);
    if (i < seg) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const land = new THREE.BufferGeometry();
  land.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  land.setIndex(idx);
  land.computeVertexNormals();
  return { palms, lights, bulbs, land };
}

/** Flat backwater bank with coconut palms strung with Christmas lights, and the glow of village houses. */
export function Shore({ snow }: { snow: number }) {
  const data = useMemo(() => makeShore(), []);
  const frond = useMemo(() => frondGeometry(), []);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const frondRef = useRef<THREE.InstancedMesh>(null);
  const bulbRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const obj = new THREE.Object3D();
    const crown = new THREE.Matrix4();
    const local = new THREE.Matrix4();
    const out = new THREE.Matrix4();
    const tilt = new THREE.Quaternion();
    const e = new THREE.Euler();
    const one = new THREE.Vector3(1, 1, 1);
    const crownAt = (p: (typeof data.palms)[number]) => {
      obj.position.set(p.x, WATER_Y, p.z);
      obj.rotation.set(0, p.rot, p.lean);
      obj.scale.set(1, 1, 1);
      obj.updateMatrix();
      return crown.copy(obj.matrix).multiply(local.makeTranslation(0, p.h, 0)).clone();
    };

    let f = 0;
    data.palms.forEach((p, i) => {
      obj.position.set(p.x, WATER_Y + p.h / 2, p.z);
      obj.rotation.set(0, p.rot, p.lean);
      obj.scale.set(1, p.h, 1);
      obj.updateMatrix();
      trunkRef.current?.setMatrixAt(i, obj.matrix);
      const c = crownAt(p);
      p.fronds.forEach((fr) => {
        e.set(fr.droop, fr.a, 0, "YXZ");
        tilt.setFromEuler(e);
        local.compose(new THREE.Vector3(0, 0, 0), tilt, new THREE.Vector3(1.35, 0.3, 1.35));
        frondRef.current?.setMatrixAt(f++, out.multiplyMatrices(c, local));
      });
    });
    data.bulbs.forEach((b, i) => {
      const p = data.palms[b.pi];
      const c = crownAt(p);
      local.compose(new THREE.Vector3(Math.cos(b.a) * b.r, b.y, Math.sin(b.a) * b.r), tilt.identity(), one.clone().multiplyScalar(0.22));
      bulbRef.current?.setMatrixAt(i, out.multiplyMatrices(c, local));
      bulbRef.current?.setColorAt(i, b.c);
    });
    data.lights.forEach((l, i) => {
      local.compose(new THREE.Vector3(l.x, WATER_Y + l.y, l.z), tilt.identity(), new THREE.Vector3(0.5, 0.35, 0.5));
      lightRef.current?.setMatrixAt(i, local);
    });
    for (const m of [trunkRef.current, frondRef.current, bulbRef.current, lightRef.current]) {
      if (m) m.instanceMatrix.needsUpdate = true;
    }
    if (bulbRef.current?.instanceColor) bulbRef.current.instanceColor.needsUpdate = true;
  }, [data]);

  const sn = Math.min(1, Math.max(0, snow));
  const land = useMemo(() => `#${new THREE.Color("#10241d").lerp(new THREE.Color("#c9d6e6"), sn).getHexString()}`, [sn]);
  const leaf = useMemo(() => `#${new THREE.Color("#1c6a41").lerp(new THREE.Color("#a9c4b6"), sn * 0.6).getHexString()}`, [sn]);

  return (
    <group>
      <mesh geometry={data.land} position={[0, WATER_Y + 0.15, 0]}>
        <meshStandardMaterial color={land} roughness={1} />
      </mesh>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, data.palms.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.16, 0.28, 1, 6]} />
        <meshStandardMaterial color="#4a3622" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={frondRef} args={[frond, undefined, data.palms.length * FRONDS]} frustumCulled={false}>
        <meshStandardMaterial color={leaf} roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={bulbRef} args={[undefined, undefined, data.bulbs.length]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={lightRef} args={[undefined, undefined, data.lights.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
