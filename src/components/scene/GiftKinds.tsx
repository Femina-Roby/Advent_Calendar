"use client";

import { useMemo, useRef, type MutableRefObject, type ReactElement } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GiftKind } from "@/lib/gifts";
import { starGeometry } from "./Decor";
import { Bamboo, Planks } from "./materials";

// The 24 gift objects. Each is its own thing and opens its own way. Local axes: +z points out from
// the wall it hangs on, +y is up. `open` is a 0..1 value eased by the parent, read every frame.
type K = { open: MutableRefObject<number> };
type V3 = readonly [number, number, number];

function useAnim(open: MutableRefObject<number>, fn: (o: number) => void) {
  useFrame(() => fn(open.current));
}

const BRASS = "#b08d3c";
const brass = <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />;
const wood = (c = "#6b4a2f") => <meshStandardMaterial color={c} roughness={0.85} />;

/** Warm light that fades in when the gift opens. Faces +z unless rotated. */
function GlowPlane({ open, w, h, pos, rot = [0, 0, 0] }: K & { w: number; h: number; pos: V3; rot?: V3 }) {
  const m = useRef<THREE.MeshBasicMaterial>(null);
  useAnim(open, (o) => {
    if (m.current) m.current.opacity = o * 0.9;
  });
  return (
    <mesh position={[pos[0], pos[1], pos[2]]} rotation={[rot[0], rot[1], rot[2]]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={m} color="#ffcf80" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function Door({ open }: K) {
  const leaf = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (leaf.current) leaf.current.rotation.y = -o * 1.75;
  });
  return (
    <group>
      <GlowPlane open={open} w={0.8} h={1.5} pos={[0, 0.75, -0.3]} />
      <group ref={leaf} position={[-0.39, 0, 0]}>
        <mesh position={[0.39, 0.75, 0]} castShadow>
          <boxGeometry args={[0.78, 1.46, 0.06]} />
          <Planks repeat={[0.6, 1]} color="#a33a35" />
        </mesh>
        <mesh position={[0.68, 0.75, 0.05]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          {brass}
        </mesh>
      </group>
    </group>
  );
}

function Shutters({ open }: K) {
  const l = useRef<THREE.Group>(null);
  const r = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (l.current) l.current.rotation.y = -o * 1.9;
    if (r.current) r.current.rotation.y = o * 1.9;
  });
  const leaf = (cx: number) => (
    <mesh position={[cx, 0, 0.04]} castShadow>
      <boxGeometry args={[0.38, 0.66, 0.04]} />
      <Planks repeat={[0.4, 0.6]} color="#2f9a9a" />
    </mesh>
  );
  return (
    <group>
      <group ref={l} position={[-0.375, 0, 0]}>
        {leaf(0.19)}
      </group>
      <group ref={r} position={[0.375, 0, 0]}>
        {leaf(-0.19)}
      </group>
    </group>
  );
}

function Teapot({ open }: K) {
  const lid = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (!lid.current) return;
    lid.current.position.y = 0.23 + o * 0.15;
    lid.current.rotation.z = o * 0.7;
  });
  return (
    <group>
      <mesh position={[0, 0.12, 0]} scale={[1, 0.85, 1]} castShadow>
        <sphereGeometry args={[0.13, 14, 12]} />
        {brass}
      </mesh>
      <mesh position={[0.17, 0.15, 0]} rotation={[0, 0, -0.9]} castShadow>
        <cylinderGeometry args={[0.015, 0.03, 0.16, 8]} />
        {brass}
      </mesh>
      <mesh position={[-0.15, 0.13, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.06, 0.012, 6, 14, Math.PI]} />
        {brass}
      </mesh>
      <group ref={lid} position={[0, 0.23, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.035, 14]} />
          {brass}
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          {brass}
        </mesh>
      </group>
    </group>
  );
}

function HangingLantern({ open }: K) {
  const door = useRef<THREE.Group>(null);
  const glass = useRef<THREE.MeshStandardMaterial>(null);
  useAnim(open, (o) => {
    if (door.current) door.current.rotation.y = -o * 1.7;
    if (glass.current) glass.current.emissiveIntensity = 0.9 + o * 2;
  });
  return (
    <group>
      <mesh position={[0.11, 0, 0]}>
        <boxGeometry args={[0.22, 0.03, 0.03]} />
        {wood("#5a3f27")}
      </mesh>
      <group position={[0.22, -0.22, 0]}>
        <mesh position={[0, 0.17, 0]} castShadow>
          <coneGeometry args={[0.15, 0.12, 6]} />
          {brass}
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <cylinderGeometry args={[0.1, 0.11, 0.05, 6]} />
          {brass}
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.3, 6]} />
          <meshStandardMaterial ref={glass} color="#f2a93b" emissive="#f2a93b" emissiveIntensity={0.9} transparent opacity={0.9} />
        </mesh>
        <group ref={door} position={[-0.09, 0, 0.088]}>
          <mesh position={[0.09, 0, 0]}>
            <boxGeometry args={[0.18, 0.26, 0.012]} />
            {brass}
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Chest({ open }: K) {
  const lid = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (lid.current) lid.current.rotation.x = -o * 1.6;
  });
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.4, 0.45]} />
        <Planks repeat={[0.5, 0.3]} color="#a33a35" />
      </mesh>
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]}>
          <boxGeometry args={[0.05, 0.41, 0.46]} />
          {brass}
        </mesh>
      ))}
      <GlowPlane open={open} w={0.6} h={0.36} pos={[0, 0.41, 0]} rot={[-Math.PI / 2, 0, 0]} />
      <group ref={lid} position={[0, 0.4, -0.225]}>
        <mesh position={[0, 0.06, 0.225]} castShadow>
          <boxGeometry args={[0.72, 0.12, 0.47]} />
          <Planks repeat={[0.5, 0.3]} color="#c04a43" />
        </mesh>
        <mesh position={[0, 0.02, 0.46]}>
          <boxGeometry args={[0.08, 0.1, 0.03]} />
          {brass}
        </mesh>
      </group>
    </group>
  );
}

function Lifebuoy({ open }: K) {
  const ring = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (ring.current) ring.current.rotation.x = -o * 1.15;
  });
  return (
    <group>
      <mesh position={[0, 0, 0.07]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshStandardMaterial color="#d9b24f" emissive="#d9b24f" emissiveIntensity={0.35} roughness={0.6} />
      </mesh>
      <group ref={ring} position={[0, 0.3, 0.16]}>
        <group position={[0, -0.3, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.27, 0.07, 10, 24]} />
            <meshStandardMaterial color="#f4f1ea" roughness={0.7} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[Math.cos((i * Math.PI) / 2) * 0.27, Math.sin((i * Math.PI) / 2) * 0.27, 0]}>
              <boxGeometry args={[0.15, 0.16, 0.16]} />
              <meshStandardMaterial color="#b8352c" roughness={0.7} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

function Blind({ open }: K) {
  const slats = useRef<THREE.Mesh>(null);
  const roll = useRef<THREE.Mesh>(null);
  useAnim(open, (o) => {
    const s = 1 - o * 0.9;
    if (slats.current) {
      slats.current.scale.y = s;
      slats.current.position.y = 0.33 - 0.33 * s;
    }
    if (roll.current) roll.current.scale.setScalar(1 + o * 1.4);
  });
  return (
    <group>
      <mesh ref={slats} position={[0, 0, 0.05]} castShadow>
        <planeGeometry args={[0.72, 0.66]} />
        <Bamboo repeat={[1, 1]} color="#d8b57a" />
      </mesh>
      <mesh ref={roll} position={[0, 0.33, 0.07]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.76, 10]} />
        <Bamboo repeat={[1, 1]} color="#c9a46a" />
      </mesh>
    </group>
  );
}

function Letterbox({ open }: K) {
  const flap = useRef<THREE.Group>(null);
  const letter = useRef<THREE.Mesh>(null);
  useAnim(open, (o) => {
    if (flap.current) flap.current.rotation.x = -o * 1.3;
    if (letter.current) letter.current.position.y = -0.02 + o * 0.16;
  });
  return (
    <group>
      <mesh position={[0, 0, 0.07]} castShadow>
        <boxGeometry args={[0.28, 0.34, 0.14]} />
        {wood("#8b2f2f")}
      </mesh>
      <mesh ref={letter} position={[0, -0.02, 0.1]}>
        <boxGeometry args={[0.2, 0.12, 0.01]} />
        <meshStandardMaterial color="#f6f0e0" emissive="#ffe9b0" emissiveIntensity={0.3} />
      </mesh>
      <group ref={flap} position={[0, 0.1, 0.145]}>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.26, 0.2, 0.02]} />
          {brass}
        </mesh>
      </group>
    </group>
  );
}

function Hatch({ open }: K) {
  const leaf = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (leaf.current) leaf.current.rotation.x = -o * 1.5;
  });
  return (
    <group>
      <GlowPlane open={open} w={0.9} h={0.58} pos={[0, 0, -0.1]} />
      <group ref={leaf} position={[0, 0.29, 0.03]}>
        <mesh position={[0, -0.29, 0]} castShadow>
          <boxGeometry args={[0.9, 0.58, 0.05]} />
          <Planks repeat={[0.7, 0.5]} color="#2f8f99" />
        </mesh>
        <mesh position={[0, -0.5, 0.05]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          {brass}
        </mesh>
      </group>
    </group>
  );
}

function Pot({ open }: K) {
  const lid = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (!lid.current) return;
    lid.current.position.y = 0.3 + o * 0.24;
    lid.current.rotation.z = o * 0.9;
  });
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.2, 0.3, 16]} />
        {brass}
      </mesh>
      <group ref={lid} position={[0, 0.3, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.035, 16]} />
          {brass}
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          {brass}
        </mesh>
      </group>
    </group>
  );
}

function Basket({ open }: K) {
  const lid = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (!lid.current) return;
    lid.current.position.set(o * 0.48, 0.36 + o * 0.22, 0);
    lid.current.rotation.z = -o * 0.8;
  });
  return (
    <group>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.24, 0.36, 14, 1, true]} />
        <Bamboo repeat={[1.5, 0.5]} color="#c9a46a" />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.02, 14]} />
        <Bamboo repeat={[1, 1]} color="#a98650" />
      </mesh>
      <group ref={lid} position={[0, 0.36, 0]}>
        <mesh position={[0, 0.09, 0]} castShadow>
          <coneGeometry args={[0.34, 0.2, 14]} />
          <Bamboo repeat={[1, 0.5]} color="#d8b57a" />
        </mesh>
      </group>
    </group>
  );
}

function Drop({ open }: K) {
  const rope = useRef<THREE.Mesh>(null);
  const bundle = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    const len = 0.3 + o * 0.45;
    if (rope.current) {
      rope.current.scale.y = len;
      rope.current.position.y = -len / 2;
    }
    if (bundle.current) bundle.current.position.y = -len - 0.12;
  });
  return (
    <group>
      <mesh ref={rope} scale={[1, 0.3, 1]}>
        <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
        <meshStandardMaterial color="#8a7048" roughness={1} />
      </mesh>
      <group ref={bundle} position={[0, -0.42, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.24, 0.3]} />
          <meshStandardMaterial color="#a98a5c" roughness={1} />
        </mesh>
        {[-0.07, 0.07].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[0.025, 0.25, 0.31]} />
            <meshStandardMaterial color="#6b5030" roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Sash({ open }: K) {
  const g = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (g.current) g.current.position.y = o * 0.62;
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[0.7, 0.62]} />
        <meshStandardMaterial color="#9fc3d6" transparent opacity={0.45} roughness={0.1} metalness={0.2} />
      </mesh>
      {(
        [
          [0, 0.33, 0.78, 0.05],
          [0, -0.33, 0.78, 0.05],
          [0.38, 0, 0.05, 0.7],
          [-0.38, 0, 0.05, 0.7],
        ] as const
      ).map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.07]} castShadow>
          <boxGeometry args={[w, h, 0.05]} />
          {wood("#f1ece0")}
        </mesh>
      ))}
    </group>
  );
}

function Curtain({ open }: K) {
  const l = useRef<THREE.Mesh>(null);
  const r = useRef<THREE.Mesh>(null);
  useAnim(open, (o) => {
    const s = 1 - o * 0.7;
    if (l.current) {
      l.current.scale.x = s;
      l.current.position.x = -(0.375 - 0.1875 * s);
    }
    if (r.current) {
      r.current.scale.x = s;
      r.current.position.x = 0.375 - 0.1875 * s;
    }
  });
  const cloth = <meshStandardMaterial color="#7a2f3a" roughness={1} side={THREE.DoubleSide} />;
  return (
    <group>
      <mesh ref={l} position={[-0.19, 0, 0.06]}>
        <planeGeometry args={[0.375, 0.66]} />
        {cloth}
      </mesh>
      <mesh ref={r} position={[0.19, 0, 0.06]}>
        <planeGeometry args={[0.375, 0.66]} />
        {cloth}
      </mesh>
      <mesh position={[0, 0.34, 0.07]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
        {brass}
      </mesh>
    </group>
  );
}

function Drawer({ open }: K) {
  const g = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (g.current) g.current.position.z = o * 0.4;
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0, 0.03]} castShadow>
        <boxGeometry args={[0.6, 0.22, 0.06]} />
        <Planks repeat={[0.5, 0.2]} color="#e6d6ae" />
      </mesh>
      <mesh position={[0, -0.07, -0.18]}>
        <boxGeometry args={[0.56, 0.05, 0.4]} />
        {wood("#5a3f27")}
      </mesh>
      <mesh position={[0, 0.02, -0.18]} castShadow>
        <boxGeometry args={[0.18, 0.14, 0.18]} />
        <meshStandardMaterial color="#d9b24f" emissive="#d9b24f" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        {brass}
      </mesh>
    </group>
  );
}

function FlapDown({ open }: K) {
  const g = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (g.current) g.current.rotation.x = o * 1.55;
  });
  return (
    <group ref={g} position={[0, -0.33, 0.04]}>
      <mesh position={[0, 0.33, 0]} castShadow>
        <boxGeometry args={[0.8, 0.66, 0.04]} />
        <Planks repeat={[0.5, 0.5]} color="#d9962f" />
      </mesh>
      <mesh position={[0, 0.58, 0.04]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        {brass}
      </mesh>
    </group>
  );
}

function Binnacle({ open }: K) {
  const dome = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (!dome.current) return;
    dome.current.position.y = 0.16 + o * 0.28;
    dome.current.rotation.y = o * 2.4;
  });
  return (
    <group>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.18, 16]} />
        {brass}
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
        <meshStandardMaterial color="#f2e6c4" emissive="#ffe0a0" emissiveIntensity={0.6} />
      </mesh>
      <group ref={dome} position={[0, 0.16, 0]}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#cfe6f0" transparent opacity={0.4} roughness={0.05} metalness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function Trapdoor({ open }: K) {
  const g = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (g.current) g.current.rotation.z = o * 1.8;
  });
  return (
    <group>
      <GlowPlane open={open} w={0.6} h={0.6} pos={[0, 0.001, 0]} rot={[-Math.PI / 2, 0, 0]} />
      <group ref={g} position={[-0.35, 0.03, 0]}>
        <mesh position={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.7, 0.05, 0.7]} />
          <Planks repeat={[0.5, 0.5]} color="#d9962f" />
        </mesh>
        <mesh position={[0.35, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.05, 0.01, 6, 14]} />
          {brass}
        </mesh>
      </group>
    </group>
  );
}

function DoubleDoor({ open }: K) {
  const l = useRef<THREE.Group>(null);
  const r = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (l.current) l.current.rotation.y = -o * 1.9;
    if (r.current) r.current.rotation.y = o * 1.9;
  });
  const leaf = (cx: number) => (
    <mesh position={[cx, 0.5, 0.03]} castShadow>
      <boxGeometry args={[0.44, 0.98, 0.05]} />
      <Planks repeat={[0.4, 0.8]} color="#3f9a5f" />
    </mesh>
  );
  return (
    <group>
      <GlowPlane open={open} w={0.9} h={1.0} pos={[0, 0.5, -0.2]} />
      <group ref={l} position={[-0.45, 0, 0]}>
        {leaf(0.225)}
      </group>
      <group ref={r} position={[0.45, 0, 0]}>
        {leaf(-0.225)}
      </group>
    </group>
  );
}

function Slider({ open }: K) {
  const g = useRef<THREE.Group>(null);
  useAnim(open, (o) => {
    if (g.current) g.current.position.x = o * 0.8;
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0, 0.06]} castShadow>
        <boxGeometry args={[0.7, 0.55, 0.04]} />
        <Bamboo repeat={[1, 0.8]} color="#e2b96b" />
      </mesh>
      <mesh position={[0.28, 0, 0.1]}>
        <boxGeometry args={[0.04, 0.2, 0.03]} />
        {brass}
      </mesh>
    </group>
  );
}

function Coconut({ open }: K) {
  const cap = useRef<THREE.Group>(null);
  const straw = useRef<THREE.Mesh>(null);
  useAnim(open, (o) => {
    if (cap.current) {
      cap.current.position.y = o * 0.26;
      cap.current.rotation.z = o * 0.8;
    }
    if (straw.current) straw.current.scale.y = 0.05 + o * 1.0;
  });
  const shell = <meshStandardMaterial color="#5b3b22" roughness={1} />;
  return (
    <group position={[0, 0.17, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.17, 14, 12, 0, Math.PI * 2, 0.9, Math.PI - 0.9]} />
        {shell}
      </mesh>
      <mesh ref={straw} position={[0.03, 0.12, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.3, 6]} />
        <meshStandardMaterial color="#d9534f" roughness={0.6} />
      </mesh>
      <group ref={cap}>
        <mesh castShadow>
          <sphereGeometry args={[0.17, 14, 8, 0, Math.PI * 2, 0, 0.9]} />
          {shell}
        </mesh>
      </group>
    </group>
  );
}

function Canoe({ open }: K) {
  const g = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) {
      g.current.position.y = Math.sin(t * 1.3) * 0.03;
      g.current.rotation.z = Math.sin(t * 0.9) * 0.03;
    }
    if (lid.current) lid.current.rotation.x = -open.current * 1.6;
  });
  return (
    <group ref={g}>
      <mesh scale={[2.0, 0.6, 0.8]} castShadow>
        <sphereGeometry args={[0.5, 16, 10]} />
        {wood("#7a5c3e")}
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.42, 0.22, 0.32]} />
        <Planks repeat={[0.3, 0.2]} color="#9a6a3a" />
      </mesh>
      <GlowPlane open={open} w={0.36} h={0.26} pos={[0, 0.37, 0]} rot={[-Math.PI / 2, 0, 0]} />
      <group ref={lid} position={[0, 0.36, -0.16]}>
        <mesh position={[0, 0.02, 0.16]} castShadow>
          <boxGeometry args={[0.44, 0.04, 0.34]} />
          <Planks repeat={[0.3, 0.2]} color="#b08d3c" />
        </mesh>
      </group>
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.22, 0]}>
          <boxGeometry args={[0.06, 0.03, 0.78]} />
          {wood("#5a3f27")}
        </mesh>
      ))}
    </group>
  );
}

function Bottle({ open }: K) {
  const cork = useRef<THREE.Mesh>(null);
  const glass = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const o = open.current;
    if (cork.current) {
      cork.current.position.set(0.36 + o * 0.5, o * 0.4, 0);
      cork.current.scale.setScalar(Math.max(0.01, 1 - Math.max(0, o - 0.7) * 3.3));
    }
    if (glass.current) glass.current.emissiveIntensity = 0.1 + o * 1.4;
    void clock;
  });
  return (
    <group rotation={[0, 0, 0.1]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.34, 14]} />
        <meshStandardMaterial ref={glass} color="#3f8f5f" emissive="#ffcf80" emissiveIntensity={0.1} transparent opacity={0.75} roughness={0.1} />
      </mesh>
      <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.06, 0.14, 12]} />
        <meshStandardMaterial color="#3f8f5f" transparent opacity={0.75} roughness={0.1} />
      </mesh>
      <mesh ref={cork} position={[0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.06, 8]} />
        {wood("#c9a46a")}
      </mesh>
      <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#f6f0e0" roughness={0.9} />
      </mesh>
    </group>
  );
}

function PaperStar({ open }: K) {
  const g = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const geo = useMemo(() => starGeometry(), []);
  useAnim(open, (o) => {
    if (g.current) {
      g.current.scale.setScalar(0.2 + o * 0.2);
      g.current.rotation.y = o * 6;
    }
    if (mat.current) mat.current.emissiveIntensity = 0.3 + o * 1.6;
  });
  return (
    <group ref={g} position={[0, 0.2, 0]}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial ref={mat} color="#f2a93b" emissive="#f2a93b" emissiveIntensity={0.3} flatShading />
      </mesh>
    </group>
  );
}

export const KINDS: Record<GiftKind, (p: K) => ReactElement> = {
  door: Door,
  shutters: Shutters,
  teapot: Teapot,
  lantern: HangingLantern,
  chest: Chest,
  lifebuoy: Lifebuoy,
  blind: Blind,
  letterbox: Letterbox,
  hatch: Hatch,
  pot: Pot,
  basket: Basket,
  drop: Drop,
  sash: Sash,
  curtain: Curtain,
  drawer: Drawer,
  flapdown: FlapDown,
  binnacle: Binnacle,
  trapdoor: Trapdoor,
  doubledoor: DoubleDoor,
  slider: Slider,
  coconut: Coconut,
  canoe: Canoe,
  bottle: Bottle,
  star: PaperStar,
};
