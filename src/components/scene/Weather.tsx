"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export const WATER_Y = 0.55;

// Small deterministic generator, so scene layout is the same every load and render stays pure.
export function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SNOW_MAX = 2000;
const SNOW_TOP = 14;

/** Falling snow: one Points object, only the first `count` flakes are drawn. */
export function Snow({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const rnd = seeded(7);
    const p = new Float32Array(SNOW_MAX * 3);
    for (let i = 0; i < SNOW_MAX; i++) {
      p[i * 3] = (rnd() - 0.5) * 40;
      p[i * 3 + 1] = rnd() * SNOW_TOP;
      p[i * 3 + 2] = (rnd() - 0.5) * 40;
    }
    return p;
  }, []);

  useFrame(({ clock }, dt) => {
    const pts = points.current;
    if (!pts) return;
    pts.geometry.setDrawRange(0, count);
    const arr = pts.geometry.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;
    const step = Math.min(dt, 0.05);
    for (let i = 0; i < count; i++) {
      const k = i * 3;
      arr[k + 1] -= (0.7 + (i % 7) * 0.12) * step;
      arr[k] += Math.sin(t * 0.6 + i) * 0.15 * step;
      if (arr[k + 1] < WATER_Y) arr[k + 1] += SNOW_TOP;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.14} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
    </points>
  );
}

/** Ice spreading outward from the hull until the water is frozen solid. */
export function Ice({ amount }: { amount: number }) {
  const [map, rough] = useTexture(
    ["/assets/tex/snow_02_Diffuse.jpg", "/assets/tex/snow_02_Rough.jpg"],
    (loaded) => {
      for (const t of Array.isArray(loaded) ? loaded : [loaded]) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(18, 18);
        t.anisotropy = 4;
      }
    },
  );
  if (amount < 0.01) return null;
  const r = 4 + amount * 80;
  return (
    <mesh position={[0, WATER_Y + 0.04, 0]} scale={[r, 1, r]} receiveShadow>
      <cylinderGeometry args={[1, 1, 0.1, 18]} />
      <meshStandardMaterial color="#cfe4f0" map={map} roughnessMap={rough} roughness={1} metalness={0} />
    </mesh>
  );
}

const MIST_SPOTS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  const r = 7 + (i % 3) * 3;
  return [Math.cos(a) * r, Math.sin(a) * r] as const;
});

/** Low banks of mist drifting around the boat. */
export function Mist({ amount, color }: { amount: number; color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += Math.min(dt, 0.05) * 0.03;
  });
  if (amount < 0.02) return null;
  return (
    <group ref={group}>
      {MIST_SPOTS.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.85 + (i % 2) * 0.25, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5, 14]} />
          <meshBasicMaterial color={color} transparent opacity={amount * 0.22} depthWrite={false} fog={false} />
        </mesh>
      ))}
    </group>
  );
}
