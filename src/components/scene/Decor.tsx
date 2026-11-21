"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---- Lanterns along the hull, posts and roof ends. The first N are lit. ----
const EAVE = 2.6;
const BOW_LAMP = 2.05;
const LANTERNS: readonly (readonly [number, number, number])[] = [
  [-3.6, 2.5, 0.9],
  [-3.6, 2.5, -0.9],
  [-6.0, BOW_LAMP, -0.5],
  [6.0, BOW_LAMP, -0.5],
  [-1.6, EAVE, 1.55],
  [1.6, EAVE, -1.55],
  [-1.8, 3.95, 1.2],
  [2.8, 3.95, -1.2],
  [0, EAVE, 1.55],
  [0, EAVE, -1.55],
  [-1.8, 3.95, -1.2],
  [2.8, 3.95, 1.2],
  [-3.2, EAVE, -1.55],
  [-3.2, EAVE, 1.55],
  [2.9, EAVE, 1.55],
  [2.9, EAVE, -1.55],
  [-1.6, EAVE, -1.55],
  [1.6, EAVE, 1.55],
];

export const LANTERN_MAX = LANTERNS.length;

export function Lanterns({ count }: { count: number }) {
  const lit = Math.min(count, LANTERNS.length);
  return (
    <group>
      {LANTERNS.slice(0, lit).map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.12, 4]} />
            <meshStandardMaterial color="#3a2a1a" roughness={1} />
          </mesh>
          <mesh position={[0, 0.115, 0]} castShadow>
            <coneGeometry args={[0.085, 0.07, 6]} />
            <meshStandardMaterial color="#4a3320" roughness={0.8} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.062, 0.062, 0.17, 6]} />
            <meshStandardMaterial color="#f2a93b" emissive="#ffb04a" emissiveIntensity={2.2} flatShading />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.07, 0.05, 0.03, 6]} />
            <meshStandardMaterial color="#4a3320" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* One shared warm light stands in for all the lanterns. */}
      <pointLight position={[0, 3.2, 0]} color="#ffb870" intensity={36 * (lit / LANTERNS.length)} distance={16} decay={2} />
      <pointLight position={[-4.6, 2.4, 0]} color="#ffb870" intensity={22 * (lit / LANTERNS.length)} distance={9} decay={2} />
      <pointLight position={[4.8, 2.4, 0]} color="#ffb870" intensity={18 * (lit / LANTERNS.length)} distance={9} decay={2} />
      <pointLight position={[0, 2.2, 3.2]} color="#ffc98a" intensity={12 * (lit / LANTERNS.length)} distance={7} decay={2} />
      <pointLight position={[0, 2.2, -3.2]} color="#ffc98a" intensity={12 * (lit / LANTERNS.length)} distance={7} decay={2} />
    </group>
  );
}

// ---- The Kerala star lantern that rises above the roof at the finale ----
export function starGeometry() {
  const s = new THREE.Shape();
  const points = 8;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 0.9 : 0.4;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false });
  g.translate(0, 0, -0.15);
  return g;
}

export function StarLantern3D({ lit }: { lit: boolean }) {
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(() => starGeometry(), []);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const target = lit ? 1 : 0;
    const k = Math.min(1, dt * 2.5);
    g.scale.setScalar(g.scale.x + (target - g.scale.x) * k);
    g.position.y = 6.3 + Math.sin(clock.elapsedTime * 1.2) * 0.08 + (1 - g.scale.x) * -1;
    g.rotation.y = clock.elapsedTime * 0.5;
    g.visible = g.scale.x > 0.02;
  });

  return (
    <group ref={group} position={[0, 5.3, 0]} scale={0.001} visible={false}>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#f2a93b" emissive="#f2a93b" emissiveIntensity={1.6} flatShading />
      </mesh>
      <pointLight color="#ffd27a" intensity={40} distance={18} decay={2} />
    </group>
  );
}
