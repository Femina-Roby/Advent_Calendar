"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  CAB_X0,
  CAB_X1,
  DECK_Y,
  DRIVER_X,
  HELM_X,
  HULL_HEIGHT,
  ROOF_BASE_Y,
  ROOF_CX,
  ROOF_LENGTH,
  ROOF_R,
  ROOF_THICK,
  ROOF_V,
  SLAB_X0,
  SLAB_X1,
  UP_WALL_TOP,
  UP_X0,
  UP_X1,
  UP_Y,
  UP_Z,
  WALL_TOP,
  WALL_Z,
  WHEEL_X,
  WHEEL_Y,
} from "@/lib/boat-dims";
import { Bamboo, Planks, Thatch } from "./materials";

// A two-storey kettuvallam: plank hull bound with coir rope, curved prow and stern, a lower cabin with
// a front door and kitchen hatch, a sundeck with the helm and driver, an upper cabin and a reed-thatch roof.
// The bow points to -x. Interactive gift objects (doors, shutters, hatches...) live in GiftKinds.tsx.
const DARK = "#8b6a4a";
const LIGHT = "#cdb59a";
const BRASS = "#b08d3c";
type V3 = readonly [number, number, number];

function hullShape() {
  const s = new THREE.Shape();
  s.moveTo(-7.2, 0);
  s.quadraticCurveTo(-6.4, 1.55, -4.6, 1.75);
  s.lineTo(4.6, 1.75);
  s.quadraticCurveTo(6.4, 1.55, 7.2, 0);
  s.quadraticCurveTo(6.4, -1.55, 4.6, -1.75);
  s.lineTo(-4.6, -1.75);
  s.quadraticCurveTo(-6.4, -1.55, -7.2, 0);
  return s;
}

/** Curved, upswept prow plank. Mirrored by rotating the mesh for the stern. */
function prowGeometry() {
  const curve = new THREE.QuadraticBezierCurve(
    new THREE.Vector2(-6.4, 0.95),
    new THREE.Vector2(-7.9, 1.0),
    new THREE.Vector2(-8.1, 2.2),
  );
  const pts = curve.getPoints(14);
  const s = new THREE.Shape();
  s.moveTo(pts[0].x, pts[0].y + 0.1);
  for (const p of pts) s.lineTo(p.x, p.y + 0.1);
  for (let i = pts.length - 1; i >= 0; i--) s.lineTo(pts[i].x + 0.14, pts[i].y - 0.1);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.7, bevelEnabled: false });
  g.translate(0, 0, -0.35);
  return g;
}

/** Half-round arch, extruded along the boat. `vScale` flattens it into the low curve of a thatch roof. */
export function archGeometry(radius: number, thickness: number, length: number, vScale = 1) {
  const s = new THREE.Shape();
  s.absarc(0, 0, radius + thickness, 0, Math.PI, false);
  s.lineTo(-radius, 0);
  s.absarc(0, 0, radius, Math.PI, 0, true);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -length / 2);
  g.scale(1, vScale, 1);
  return g;
}

/** Solid half-ellipse that closes the gable above an end wall. */
function gableGeometry() {
  const s = new THREE.Shape();
  s.absellipse(0, 0, ROOF_R, ROOF_R * ROOF_V, 0, Math.PI, false, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -0.04);
  return g;
}

/** A plank-textured box. Tiling follows the box size so boards keep a constant scale. */
function Block({ p, s, color = LIGHT }: { p: V3; s: V3; color?: string }) {
  const rep: [number, number] = [Math.max(s[0], s[2]) / 1.4, Math.max(s[1], 0.1) / 1.4];
  return (
    <mesh position={[p[0], p[1], p[2]]} castShadow receiveShadow>
      <boxGeometry args={[s[0], s[1], s[2]]} />
      <Planks repeat={rep} color={color} />
    </mesh>
  );
}

function Hull() {
  const hull = useMemo(
    () =>
      new THREE.ExtrudeGeometry(hullShape(), {
        depth: HULL_HEIGHT,
        bevelEnabled: true,
        bevelSize: 0.06,
        bevelThickness: 0.06,
        bevelSegments: 2,
        curveSegments: 10,
      }),
    [],
  );
  const deck = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(hullShape(), { depth: 0.05, bevelEnabled: false, curveSegments: 10 });
    g.scale(0.97, 0.93, 1);
    return g;
  }, []);
  const prow = useMemo(() => prowGeometry(), []);
  const bindings = useMemo(() => Array.from({ length: 11 }, (_, i) => -4.5 + i * 0.9), []);

  return (
    <group>
      <mesh geometry={hull} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <Planks repeat={[0.45, 0.45]} color={DARK} />
      </mesh>
      <mesh geometry={deck} position={[0, HULL_HEIGHT + 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <Planks repeat={[0.5, 0.5]} color="#b79470" />
      </mesh>

      {/* Coir rope bindings lashing the planks, both sides. */}
      {bindings.map((x) =>
        [-1, 1].map((side) => (
          <mesh key={`${x}-${side}`} position={[x, 0.5, side * 1.8]} castShadow>
            <boxGeometry args={[0.07, 0.95, 0.07]} />
            <meshStandardMaterial color="#3f2d1c" roughness={1} />
          </mesh>
        )),
      )}

      {/* Upswept prow and stern. */}
      <mesh geometry={prow} castShadow receiveShadow>
        <Planks repeat={[0.6, 0.6]} color="#7a5c3e" />
      </mesh>
      <mesh geometry={prow} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
        <Planks repeat={[0.6, 0.6]} color="#7a5c3e" />
      </mesh>

      {/* Bow and stern lamp posts. */}
      {[-6.0, 6.0].flatMap((x) =>
        [-0.5, 0.5].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, DECK_Y + 0.45, z]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.9, 6]} />
            <meshStandardMaterial color="#5a3f27" roughness={1} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Window({ x, y, z, w, h, glow }: { x: number; y: number; z: number; w: number; h: number; glow: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          color="#ffd9a0"
          emissive="#ffb55a"
          emissiveIntensity={0.7 + glow * 1.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {(
        [
          [0, h / 2 + 0.02, w + 0.08, 0.05],
          [0, -h / 2 - 0.02, w + 0.08, 0.05],
          [w / 2 + 0.02, 0, 0.05, h + 0.08],
          [-w / 2 - 0.02, 0, 0.05, h + 0.08],
          [0, 0, 0.03, h],
          [0, 0, w, 0.03],
        ] as const
      ).map(([ox, oy, bw, bh], i) => (
        <mesh key={i} position={[ox, oy, 0]} castShadow>
          <boxGeometry args={[bw, bh, 0.07]} />
          <meshStandardMaterial color="#4a3320" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

type WallProps = {
  z: number;
  x0: number;
  x1: number;
  yBase: number;
  sill: number;
  head: number;
  top: number;
  windows: readonly number[];
  winW: number;
  glow: number;
};

/** A long wall with window openings: sill block, header block, and piers between the windows. */
function WallRun({ z, x0, x1, yBase, sill, head, top, windows, winW, glow }: WallProps) {
  const cx = (x0 + x1) / 2;
  const len = x1 - x0;
  const edges = [x0, ...windows.flatMap((w) => [w - winW / 2, w + winW / 2]), x1];
  const piers = Array.from({ length: windows.length + 1 }, (_, i) => [edges[2 * i], edges[2 * i + 1]] as const);
  return (
    <group>
      <Block p={[cx, (yBase + sill) / 2, z]} s={[len, sill - yBase, 0.09]} />
      <Block p={[cx, (head + top) / 2, z]} s={[len, top - head, 0.09]} />
      {piers.map(([a, b], i) => (
        <Block key={i} p={[(a + b) / 2, (sill + head) / 2, z]} s={[b - a, head - sill, 0.09]} />
      ))}
      {windows.map((w) => (
        <Window key={w} x={w} y={(sill + head) / 2} z={z} w={winW} h={head - sill - 0.04} glow={glow} />
      ))}
    </group>
  );
}

/** Lower floor: front door opening, kitchen hatch opening, four windows each side. */
function LowerCabin({ glow }: { glow: number }) {
  const h = 1.5;
  return (
    <group>
      {[1, -1].map((side) => (
        <WallRun
          key={side}
          z={side * WALL_Z}
          x0={CAB_X0}
          x1={CAB_X1}
          yBase={DECK_Y}
          sill={1.72}
          head={2.4}
          top={WALL_TOP}
          windows={[-2.0, -0.35, 1.3]}
          winW={0.75}
          glow={glow}
        />
      ))}
      {/* Front wall with the door opening (the leaf itself is the gift). */}
      <Block p={[CAB_X0, DECK_Y + h / 2, -0.85]} s={[0.1, h, 0.9]} />
      <Block p={[CAB_X0, DECK_Y + h / 2, 0.85]} s={[0.1, h, 0.9]} />
      <Block p={[CAB_X0, (DECK_Y + h + WALL_TOP) / 2, 0]} s={[0.1, WALL_TOP - DECK_Y - h, 1.6]} />
      {/* Rear wall with the serving hatch opening. */}
      <Block p={[CAB_X1, (DECK_Y + 1.75) / 2, 0]} s={[0.1, 1.75 - DECK_Y, 2.6]} />
      <Block p={[CAB_X1, (2.35 + WALL_TOP) / 2, 0]} s={[0.1, WALL_TOP - 2.35, 2.6]} />
      <Block p={[CAB_X1, 2.05, -0.875]} s={[0.1, 0.6, 0.85]} />
      <Block p={[CAB_X1, 2.05, 0.875]} s={[0.1, 0.6, 0.85]} />
    </group>
  );
}

/** The slab that is both the lower roof and the upper floor, with railings around the sundeck. */
function UpperFloor() {
  const len = SLAB_X1 - SLAB_X0;
  const cx = (SLAB_X0 + SLAB_X1) / 2;
  const posts = useMemo(() => Array.from({ length: 9 }, (_, i) => SLAB_X0 + i * (len / 8)), [len]);
  const railY = UP_Y + 0.9;
  return (
    <group>
      <mesh position={[cx, UP_Y - 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, 0.1, 2.9]} />
        <Planks repeat={[len / 1.6, 2.9 / 1.6]} color="#b79470" />
      </mesh>
      {[-1.45, 1.45].map((z) => (
        <group key={z}>
          <mesh position={[cx, railY, z]} castShadow>
            <boxGeometry args={[len, 0.05, 0.05]} />
            <meshStandardMaterial color="#5a3f27" roughness={1} />
          </mesh>
          {posts.map((x) => (
            <mesh key={x} position={[x, UP_Y + 0.45, z]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.9, 6]} />
              <meshStandardMaterial color="#5a3f27" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[SLAB_X0, railY, 0]} castShadow>
        <boxGeometry args={[0.05, 0.05, 2.9]} />
        <meshStandardMaterial color="#5a3f27" roughness={1} />
      </mesh>
      {[-1.45, -0.7, 0, 0.7, 1.45].map((z) => (
        <mesh key={z} position={[SLAB_X0, UP_Y + 0.45, z]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.9, 6]} />
          <meshStandardMaterial color="#5a3f27" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Stairs up from the stern deck to the upper floor, along the port walkway. */
function Stairs() {
  const steps = 7;
  const rise = (UP_Y - DECK_Y) / steps;
  const run = 0.235;
  return (
    <group>
      {Array.from({ length: steps }, (_, i) => {
        const h = (i + 1) * rise;
        return (
          <mesh key={i} position={[SLAB_X1 + 0.12 + (steps - 1 - i) * run, DECK_Y + h / 2, -1.35]} castShadow receiveShadow>
            <boxGeometry args={[run, h, 0.5]} />
            <Planks repeat={[0.3, Math.max(h, 0.3) / 1.4]} color="#a98a68" />
          </mesh>
        );
      })}
    </group>
  );
}

/** Upper cabin: two windows each side, front wall with the double-door opening, solid rear wall. */
function UpperCabin({ glow }: { glow: number }) {
  const doorH = 1.0;
  return (
    <group>
      {[1, -1].map((side) => (
        <WallRun
          key={side}
          z={side * UP_Z}
          x0={UP_X0}
          x1={UP_X1}
          yBase={UP_Y}
          sill={3.4}
          head={3.95}
          top={UP_WALL_TOP}
          windows={[0.0, 1.6]}
          winW={0.7}
          glow={glow}
        />
      ))}
      <Block p={[UP_X0, UP_Y + doorH / 2, -0.775]} s={[0.1, doorH, 0.65]} />
      <Block p={[UP_X0, UP_Y + doorH / 2, 0.775]} s={[0.1, doorH, 0.65]} />
      <Block p={[UP_X0, (UP_Y + doorH + UP_WALL_TOP) / 2, 0]} s={[0.1, UP_WALL_TOP - UP_Y - doorH, 2.2]} />
      <Block p={[UP_X1, (UP_Y + UP_WALL_TOP) / 2, 0]} s={[0.1, UP_WALL_TOP - UP_Y, 2.2]} />
    </group>
  );
}

function Roof({ snow }: { snow: number }) {
  const roof = useMemo(() => archGeometry(ROOF_R, ROOF_THICK, ROOF_LENGTH, ROOF_V), []);
  const cap = useMemo(() => archGeometry(ROOF_R + 0.1, 0.1, ROOF_LENGTH + 0.2, ROOF_V), []);
  const gable = useMemo(() => gableGeometry(), []);
  const ribs = useMemo(() => Array.from({ length: 5 }, (_, i) => ROOF_CX - 2.0 + i * 1.0), []);
  const thatch = useMemo(() => new THREE.Color("#ffffff").lerp(new THREE.Color("#f4f8fb"), snow * 0.7), [snow]);

  return (
    <group>
      <mesh geometry={roof} position={[ROOF_CX, ROOF_BASE_Y, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <Thatch repeat={[0.55, 0.55]} color={`#${thatch.getHexString()}`} />
      </mesh>
      {snow > 0.05 ? (
        <mesh
          geometry={cap}
          position={[ROOF_CX, ROOF_BASE_Y + 0.02, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1, 1, Math.min(1, snow)]}
          castShadow
        >
          <meshStandardMaterial color="#f7fbff" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
      {ribs.map((x) => (
        <mesh key={x} position={[x, ROOF_BASE_Y, 0]} rotation={[0, Math.PI / 2, 0]} scale={[1, ROOF_V, 1]}>
          <torusGeometry args={[ROOF_R - 0.02, 0.035, 6, 24, Math.PI]} />
          <meshStandardMaterial color="#8b6a3e" roughness={0.8} />
        </mesh>
      ))}
      {[UP_X0, UP_X1].map((x) => (
        <mesh key={x} geometry={gable} position={[x, ROOF_BASE_Y, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <Planks repeat={[0.8, 0.8]} color={DARK} />
        </mesh>
      ))}
    </group>
  );
}

function Limb({ a, b, r, color }: { a: V3; b: V3; r: number; color: string }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const length = dir.length();
    return {
      pos: va.clone().add(vb).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()),
      len: length,
    };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <cylinderGeometry args={[r, r, len, 8]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

// The driver is a woman in a chatta (blouse) and mundu (wrap skirt) with a kasavu border, a fisherwoman's
// waist cloth, and a braid with jasmine. Coordinates are local to her feet; she faces the bow (-x).
const SHOULDER_L: V3 = [0, 1.4, 0.17];
const SHOULDER_R: V3 = [0, 1.4, -0.17];
const ELBOW_L: V3 = [-0.2, 1.2, 0.2];
const ELBOW_R: V3 = [-0.2, 1.2, -0.2];
const HAND_L: V3 = [WHEEL_X - DRIVER_X, 1.26, 0.19];
const HAND_R: V3 = [WHEEL_X - DRIVER_X, 1.26, -0.19];
const SPOKES = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI);
const JASMINE: V3[] = [
  [0.12, 1.74, 0.0],
  [0.1, 1.71, 0.07],
  [0.1, 1.71, -0.07],
  [0.14, 1.66, 0.04],
  [0.14, 1.66, -0.04],
  [0.15, 1.58, 0.0],
  [0.16, 1.5, 0.0],
  [0.17, 1.42, 0.0],
];

/** The helm: console, spoked wheel that sways, and a woman in chatta and mundu steering the boat. */
function Helm({ festive }: { festive: boolean }) {
  const wheel = useRef<THREE.Group>(null);
  const driver = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (wheel.current) wheel.current.rotation.x = Math.sin(t * 0.5) * 0.55;
    if (driver.current) driver.current.position.y = UP_Y + Math.sin(t * 1.4) * 0.008;
  });

  const skin = "#9a6844";
  const cream = "#f4eee0";
  const gold = "#c9a24b";
  const shawl = "#1e4d3a";
  return (
    <group>
      <mesh position={[HELM_X, UP_Y + 0.375, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.75, 0.9]} />
        <Planks repeat={[0.5, 0.5]} color="#7a5c3e" />
      </mesh>

      {/* Wheel: a rim, eight spokes through a hub, brass hub. Axis along x. */}
      <group ref={wheel} position={[WHEEL_X, WHEEL_Y, 0]}>
        <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[0.26, 0.025, 8, 28]} />
          <meshStandardMaterial color="#6b4a2f" roughness={0.7} />
        </mesh>
        {SPOKES.map((a) => (
          <mesh key={a} rotation={[a, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.62, 0.03]} />
            <meshStandardMaterial color="#6b4a2f" roughness={0.7} />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 14]} />
          <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
      <mesh position={[HELM_X + 0.3, WHEEL_Y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.32, 8]} />
        <meshStandardMaterial color="#5a3f27" roughness={0.8} />
      </mesh>

      {/* Driver. */}
      <group ref={driver} position={[DRIVER_X, UP_Y, 0]}>
        {/* Mundu: a long flared wrap skirt in cream with a gold kasavu border at the hem. */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.27, 1.0, 14]} />
          <meshStandardMaterial color={cream} roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.272, 0.276, 0.08, 14]} />
          <meshStandardMaterial color={gold} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Waist cloth, tied the way fisherwomen do. */}
        <mesh position={[0, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.175, 0.035, 8, 18]} />
          <meshStandardMaterial color="#2b6f77" roughness={0.9} />
        </mesh>
        <mesh position={[-0.17, 0.92, 0.04]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.05, 0.22, 0.04]} />
          <meshStandardMaterial color="#2b6f77" roughness={0.9} />
        </mesh>
        {/* Chatta: short-sleeved blouse. */}
        <mesh position={[0, 1.24, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.17, 0.42, 14]} />
          <meshStandardMaterial color={cream} roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.155, 0.155, 0.04, 14]} />
          <meshStandardMaterial color={gold} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Neck, head, bindi. */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 0.1, 10]} />
          <meshStandardMaterial color={skin} roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.62, 0]} castShadow>
          <sphereGeometry args={[0.115, 16, 14]} />
          <meshStandardMaterial color={skin} roughness={0.8} />
        </mesh>
        <mesh position={[-0.112, 1.65, 0]}>
          <sphereGeometry args={[0.014, 8, 8]} />
          <meshStandardMaterial color="#b8352c" roughness={0.6} />
        </mesh>
        {/* Hair: cap, bun, long braid with jasmine garland. */}
        <mesh position={[0.012, 1.645, 0]} castShadow>
          <sphereGeometry args={[0.122, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color="#14100c" roughness={0.9} />
        </mesh>
        <mesh position={[0.1, 1.68, 0]} castShadow>
          <sphereGeometry args={[0.07, 12, 10]} />
          <meshStandardMaterial color="#14100c" roughness={0.9} />
        </mesh>
        <mesh position={[0.13, 1.36, 0]} rotation={[0, 0, 0.14]} castShadow>
          <cylinderGeometry args={[0.035, 0.02, 0.62, 8]} />
          <meshStandardMaterial color="#14100c" roughness={0.9} />
        </mesh>
        {JASMINE.map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshStandardMaterial color="#fffdf2" emissive="#fff6d8" emissiveIntensity={0.35} roughness={0.7} />
          </mesh>
        ))}
        {/* Arms: fabric upper arm, bare forearm, gold bangle. */}
        <Limb a={SHOULDER_L} b={ELBOW_L} r={0.045} color={cream} />
        <Limb a={ELBOW_L} b={HAND_L} r={0.036} color={skin} />
        <Limb a={SHOULDER_R} b={ELBOW_R} r={0.045} color={cream} />
        <Limb a={ELBOW_R} b={HAND_R} r={0.036} color={skin} />
        {[HAND_L, HAND_R].map(([x, y, z], i) => (
          <mesh key={i} position={[x + 0.08, y - 0.02, z * 1.1]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.04, 0.008, 6, 14]} />
            <meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {/* Winter: a deep-green woollen shawl over the shoulders. */}
        {festive ? (
          <group>
            <mesh position={[0, 1.37, 0]} castShadow>
              <cylinderGeometry args={[0.19, 0.2, 0.16, 14]} />
              <meshStandardMaterial color={shawl} roughness={1} />
            </mesh>
            <mesh position={[0.17, 1.12, 0]} castShadow>
              <boxGeometry args={[0.04, 0.5, 0.3]} />
              <meshStandardMaterial color={shawl} roughness={1} />
            </mesh>
          </group>
        ) : null}
      </group>
    </group>
  );
}

function CaneChair({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  return (
    <group position={[position[0], position[1], position[2]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.5, 0.05, 0.5]} />
        <Bamboo repeat={[1, 1]} color="#c9a46a" />
      </mesh>
      <mesh position={[0, 0.7, 0.23]} castShadow>
        <boxGeometry args={[0.5, 0.55, 0.05]} />
        <Bamboo repeat={[1, 1]} color="#c9a46a" />
      </mesh>
      {[-0.22, 0.22].flatMap((x) =>
        [-0.22, 0.22].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.2, z]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.4, 6]} />
            <meshStandardMaterial color="#6b4a2f" roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Seating area on the open bow deck. The teapot on the table is a gift. */
function FrontDeck() {
  return (
    <group>
      <CaneChair position={[-4.4, DECK_Y, 0.78]} />
      <CaneChair position={[-4.4, DECK_Y, -0.78]} rotation={Math.PI} />
      <mesh position={[-4.4, DECK_Y + 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.05, 20]} />
        <Planks repeat={[0.4, 0.4]} color="#9a7a58" />
      </mesh>
      <mesh position={[-4.4, DECK_Y + 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.1, 0.5, 8]} />
        <meshStandardMaterial color="#5a3f27" roughness={1} />
      </mesh>
    </group>
  );
}

/** Stern kitchen: clay stove and firewood. The pot and the woven basket are gifts. */
function Kitchen() {
  return (
    <group>
      <mesh position={[3.5, DECK_Y + 0.3, -0.65]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.6, 0.6]} />
        <meshStandardMaterial color="#8a5a3c" roughness={1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[4.35, DECK_Y + 0.08 + i * 0.1, -0.7 + (i % 2) * 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.7, 7]} />
          <meshStandardMaterial color="#5a3f27" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

type Props = {
  /** 0..1 snow on the thatch. */
  snow?: number;
  /** 0..1 warmth of the window light. */
  glow?: number;
  /** Winter mood: the driver wears a green woollen shawl. */
  festive?: boolean;
};

export function Boat({ snow = 0, glow = 0, festive = false }: Props) {
  return (
    <group>
      <Hull />
      <LowerCabin glow={glow} />
      <UpperFloor />
      <Stairs />
      <UpperCabin glow={glow} />
      <Roof snow={snow} />
      <Helm festive={festive} />
      <FrontDeck />
      <Kitchen />
    </group>
  );
}
