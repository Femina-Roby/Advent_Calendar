"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CAB_X0, DECK_Y, ROOF_BASE_Y, ROOF_R, ROOF_THICK, ROOF_V, SLAB_X0, SLAB_X1, UP_Y } from "@/lib/boat-dims";
import { GiftBox } from "./GiftBox";
import { starGeometry } from "./Decor";
import { seeded } from "./Weather";

type V3 = readonly [number, number, number];

const LIGHT_COLORS = ["#ffd27a", "#fff3d0", "#ffd27a", "#ff5a4a", "#ffd27a", "#9dff9a", "#6ab7ff", "#fff3d0"];

/** Evenly spaced points along a line with a gentle sag between supports, like hung fairy lights. */
function swag(a: V3, b: V3, spacing = 0.3, sagEvery = 0.9, sag = 0.07): V3[] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const n = Math.max(2, Math.round(len / spacing));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const seg = (t * len) / sagEvery;
    const y = a[1] + (b[1] - a[1]) * t - sag * Math.sin(Math.PI * (seg - Math.floor(seg)));
    return [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t] as const;
  });
}

/** Points following the arch of the upper roof's gable edge. */
function gableArc(x: number): V3[] {
  const r = ROOF_R + ROOF_THICK;
  const pts: V3[] = [];
  for (let z = -r + 0.1; z <= r - 0.1; z += 0.26) {
    pts.push([x, ROOF_BASE_Y + 0.03 + ROOF_V * Math.sqrt(Math.max(0, r * r - z * z)), z]);
  }
  return pts;
}

function lightPoints(): V3[] {
  const e = ROOF_R + ROOF_THICK;
  return [
    ...swag([-1.9, ROOF_BASE_Y + 0.02, e], [2.9, ROOF_BASE_Y + 0.02, e]),
    ...swag([-1.9, ROOF_BASE_Y + 0.02, -e], [2.9, ROOF_BASE_Y + 0.02, -e]),
    ...swag([SLAB_X0, UP_Y - 0.2, 1.5], [SLAB_X1, UP_Y - 0.2, 1.5]),
    ...swag([SLAB_X0, UP_Y - 0.2, -1.5], [SLAB_X1, UP_Y - 0.2, -1.5]),
    ...swag([SLAB_X0, UP_Y - 0.2, -1.5], [SLAB_X0, UP_Y - 0.2, 1.5]),
    ...gableArc(-1.92),
    ...gableArc(2.92),
  ];
}

/** Fairy lights along the roof edges and gables. More of them twinkle on as the doors open. */
export function FairyLights({ amount }: { amount: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const bulbs = useMemo(() => {
    const rnd = seeded(77);
    const pts = lightPoints();
    // Shuffle, so lights come on scattered along the lines rather than from one end.
    for (let i = pts.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }
    return pts.map((p, i) => ({ p, phase: rnd() * 6.28, color: new THREE.Color(LIGHT_COLORS[i % LIGHT_COLORS.length]) }));
  }, []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    bulbs.forEach((b, i) => m.setColorAt(i, b.color));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [bulbs]);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const dummy = new THREE.Object3D();
    const n = Math.round(Math.min(1, Math.max(0, amount)) * bulbs.length);
    m.count = n;
    for (let i = 0; i < n; i++) {
      const b = bulbs[i];
      dummy.position.set(b.p[0], b.p[1], b.p[2]);
      dummy.scale.setScalar(0.036 * (0.8 + 0.35 * Math.sin(t * 2.2 + b.phase)));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, bulbs.length]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </instancedMesh>
  );
}

/** A holly wreath with a red bow above the front door. */
export function Wreath() {
  return (
    <group position={[CAB_X0 - 0.08, 2.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh castShadow>
        <torusGeometry args={[0.27, 0.06, 8, 24]} />
        <meshStandardMaterial color="#1e4d3a" roughness={1} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0.05]}>
            <sphereGeometry args={[0.032, 8, 8]} />
            <meshStandardMaterial color="#b8352c" roughness={0.5} />
          </mesh>
        );
      })}
      <group position={[0, -0.27, 0.06]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.08, 0, 0]} rotation={[0, 0, s * 0.5]} scale={[1, 0.6, 0.5]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshStandardMaterial color="#b8352c" roughness={0.6} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#b8352c" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/** Pine garland along the sundeck rails, studded with red and gold baubles. */
export function Garland() {
  const len = SLAB_X1 - SLAB_X0;
  const baubles = useMemo(() => {
    const out: { p: V3; c: string }[] = [];
    const y = UP_Y + 0.74;
    for (const z of [-1.45, 1.45]) {
      for (let x = SLAB_X0 + 0.2; x < SLAB_X1; x += 0.45) out.push({ p: [x, y, z], c: out.length % 2 ? "#c9a24b" : "#b8352c" });
    }
    for (let z = -1.2; z <= 1.2; z += 0.4) out.push({ p: [SLAB_X0, y, z], c: out.length % 2 ? "#c9a24b" : "#b8352c" });
    return out;
  }, []);
  return (
    <group>
      {[-1.45, 1.45].map((z) => (
        <mesh key={z} position={[(SLAB_X0 + SLAB_X1) / 2, UP_Y + 0.76, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, len, 8]} />
          <meshStandardMaterial color="#1e4d3a" roughness={1} flatShading />
        </mesh>
      ))}
      <mesh position={[SLAB_X0, UP_Y + 0.76, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2.9, 8]} />
        <meshStandardMaterial color="#1e4d3a" roughness={1} flatShading />
      </mesh>
      {baubles.map((b, i) => (
        <mesh key={i} position={[b.p[0], b.p[1], b.p[2]]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color={b.c} metalness={0.5} roughness={0.35} emissive={b.c} emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/** A small decorated tree with a star, coloured lights and presents at its foot, for the decks. */
export function MiniTree({ position, scale = 1, grow }: { position: V3; scale?: number; grow: number }) {
  const star = useMemo(() => starGeometry(), []);
  const bulbs = useMemo(() => {
    const rnd = seeded(position[0] * 7 + 3);
    return Array.from({ length: 12 }, (_, i) => {
      const tier = i % 3;
      const r = [0.5, 0.38, 0.24][tier] * (0.55 + rnd() * 0.45);
      const a = rnd() * Math.PI * 2;
      const y = [0.5, 0.95, 1.35][tier] + (rnd() - 0.4) * 0.2;
      return { p: [Math.cos(a) * r, y, Math.sin(a) * r] as V3, c: LIGHT_COLORS[i % LIGHT_COLORS.length] };
    });
  }, [position]);
  // The deck trees appear late: they rise in over the last stretch of the calendar.
  const g = Math.min(1, Math.max(0, (grow - 0.2) / 0.6));
  if (g < 0.02) return null;
  return (
    <group position={[position[0], position[1], position[2]]} scale={scale * g}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.3, 8]} />
        <meshStandardMaterial color="#5a3f27" roughness={1} />
      </mesh>
      {[
        [0.55, 0.8, 0.6],
        [0.42, 0.7, 1.05],
        [0.28, 0.6, 1.45],
      ].map(([r, h, y], i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <coneGeometry args={[r, h, 8]} />
          <meshStandardMaterial color="#1e4d3a" roughness={0.95} flatShading />
        </mesh>
      ))}
      {bulbs.map((b, i) => (
        <mesh key={i} position={[b.p[0], b.p[1], b.p[2]]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={b.c} toneMapped={false} />
        </mesh>
      ))}
      <mesh geometry={star} position={[0, 1.9, 0]} scale={0.14}>
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <group position={[0.4, 0.15, 0.25]} scale={0.55}>
        <GiftBox variant={0} />
      </group>
      <group position={[-0.35, 0.12, 0.35]} rotation={[0, 0.7, 0]} scale={0.45}>
        <GiftBox variant={2} />
      </group>
      <group position={[0.1, 0.12, -0.45]} rotation={[0, -0.5, 0]} scale={0.5}>
        <GiftBox variant={1} />
      </group>
    </group>
  );
}

export function Christmas({ lights, grow }: { lights: number; grow: number }) {
  return (
    <group>
      <FairyLights amount={lights} />
      <Wreath />
      <Garland />
      <MiniTree position={[-5.3, DECK_Y, 1.15]} scale={1.1} grow={grow} />
      <MiniTree position={[5.3, DECK_Y, -1.05]} scale={0.95} grow={grow} />
    </group>
  );
}
