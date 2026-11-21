"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { GIFTS } from "@/lib/gifts";
import { sceneParams } from "@/lib/scene-params";
import type { GiftState } from "@/components/ui/GiftTag";
import { Boat } from "./Boat";
import { Christmas } from "./Christmas";
import { Lanterns, StarLantern3D } from "./Decor";
import { Forest, Shore } from "./Forest";
import { Fireflies, MOON_POS, Moon, Stars } from "./Night";
import { GiftMarker } from "./GiftMarker";
import { Sky } from "./Sky";
import { Water } from "./Water";
import { isLowEnd } from "@/lib/quality";
import { Ice, Mist, Snow } from "./Weather";

export type SceneProps = {
  /** Smoothly changing 0..24 value that drives the freeze look. */
  progress: number;
  /** Whole number of doors opened. Drives the gift states. */
  opened: number;
  onGiftClick: (n: number) => void;
  /** Set when a locked gift was tried out of order. `tick` must change each time. */
  wobble?: { n: number; tick: number } | null;
  /** Glide the camera to look at this gift. `tick` must change for each request. */
  focus?: { n: number; tick: number } | null;
  /** Fixed camera, for screenshots and tests. Switches off the idle rotation. */
  camera?: { pos: [number, number, number]; target: [number, number, number] };
  /** The calendar's doors, so each opened gift can show its own photo or link. */
  doors?: readonly { photoPath: string | null; linkUrl: string | null }[];
};

type Goal = { pos: THREE.Vector3; target: THREE.Vector3 };

/** Eases the camera round to a gift, so you can see it open and find the next one. Dragging cancels it. */
function CameraRig({
  focus,
  goalRef,
  controlsRef,
}: {
  focus: SceneProps["focus"];
  goalRef: RefObject<Goal | null>;
  controlsRef: RefObject<ComponentRef<typeof OrbitControls> | null>;
}) {
  useEffect(() => {
    if (!focus) return;
    const spec = GIFTS[focus.n - 1];
    if (!spec) return;
    const g = new THREE.Vector3(...spec.pos);
    const dir = new THREE.Vector3(Math.sin(spec.rotY), 0, Math.cos(spec.rotY));
    const target = g.clone().multiplyScalar(0.85).add(new THREE.Vector3(0, 2.5, 0).multiplyScalar(0.15));
    const pos = g.clone().addScaledVector(dir, 6.8);
    pos.y = Math.max(g.y + 2.8, 3.6);
    goalRef.current = { pos, target };
  }, [focus, goalRef]);

  useFrame((state, dt) => {
    const gl = goalRef.current;
    const c = controlsRef.current;
    if (!gl || !c) return;
    const k = 1 - Math.exp(-dt * 3.2);
    state.camera.position.lerp(gl.pos, k);
    c.target.lerp(gl.target, k);
    c.update();
    if (state.camera.position.distanceTo(gl.pos) < 0.05) goalRef.current = null;
  });
  return null;
}

/** The boat rocks gently on the waves, and goes still as the ice locks it in. */
function BoatRig({ ice, children }: { ice: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const k = 1 - Math.min(1, ice * 1.2);
    const grp = g.current;
    if (!grp) return;
    grp.position.y = Math.sin(t * 0.9) * 0.045 * k;
    grp.rotation.z = Math.sin(t * 0.7 + 1) * 0.012 * k;
    grp.rotation.x = Math.sin(t * 0.55) * 0.008 * k;
  });
  return <group ref={g}>{children}</group>;
}

const MOON_LIGHT = MOON_POS.clone().multiplyScalar(0.6).toArray() as [number, number, number];

export default function Scene({ progress, opened, onGiftClick, wobble, focus, camera, doors }: SceneProps) {
  const params = useMemo(() => sceneParams(progress), [progress]);
  const [auto, setAuto] = useState(true);
  const low = useMemo(() => isLowEnd(), []);
  const goal = useRef<Goal | null>(null);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const lights = 0.3 + (0.7 * (params.lanternCount - 4)) / 14;

  const stateOf = (n: number): GiftState => (n <= opened ? "opened" : n === opened + 1 ? "next" : "locked");

  return (
    <Canvas
      shadows="percentage"
      dpr={low ? [1, 1.25] : [1, 1.5]}
      camera={{ position: camera?.pos ?? [-12, 5.2, 13.5], fov: 42, near: 0.1, far: 420 }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={[params.fogColor]} />
      <fogExp2 attach="fog" args={[params.fogColor, params.fogDensity]} />
      <Sky top={params.skyTop} horizon={params.fogColor} />
      <Stars alpha={params.starAlpha} />
      <Moon alpha={params.starAlpha} />
      <Fireflies alpha={params.fireflies} />

      {/* Image-based lighting from a bundled dusk sky: reflections and soft fill, no CDN. */}
      <Suspense fallback={null}>
        <Environment files="/assets/hdri/kiara_9_dusk_1k.hdr" environmentIntensity={params.envIntensity} />
      </Suspense>

      <ambientLight intensity={0.16 + params.envIntensity * 0.5} />
      {/* Cool fill from the viewer's side, so the boat is never lost against the moonlit sky. */}
      <directionalLight color="#8fa8e0" intensity={0.9} position={[-8, 10, 14]} />
      <directionalLight
        color={params.lightColor}
        intensity={params.lightIntensity * 3.2}
        position={MOON_LIGHT}
        castShadow
        shadow-mapSize={low ? [512, 512] : [1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      >
        <orthographicCamera attach="shadow-camera" args={[-14, 14, 14, -14, 1, 80]} />
      </directionalLight>

      {/* Water, then everything the freeze adds on top of it. */}
      <Water color={params.waterColor} fogColor={params.fogColor} fogDensity={params.fogDensity} moon={params.starAlpha} mirrorSize={low ? 256 : 512} />
      <Suspense fallback={null}>
        <Ice amount={params.ice} />
      </Suspense>
      <Mist amount={params.mist} color="#eaf2f6" />
      <Snow count={Math.min(params.snowCount, low ? 900 : 2000)} />
      <Forest growth={params.treeGrowth} snow={params.roofSnow} />
      <Shore snow={params.roofSnow} />

      <BoatRig ice={params.ice}>
      <Suspense fallback={null}>
        <Boat snow={params.roofSnow} glow={params.lanternCount / 18} festive={params.roofSnow > 0.25} />
      </Suspense>
      <Suspense fallback={null}>
        <Christmas lights={lights} grow={params.treeGrowth} />
      </Suspense>
      <Lanterns count={params.lanternCount} />
      <StarLantern3D lit={params.starLit} />

      {GIFTS.map((spec, i) => (
        <GiftMarker
          key={i}
          number={i + 1}
          spec={spec}
          door={doors?.[i]}
          state={stateOf(i + 1)}
          wobbleTick={wobble?.n === i + 1 ? wobble.tick : 0}
          onClick={onGiftClick}
        />
      ))}
      </BoatRig>

      <CameraRig focus={focus} goalRef={goal} controlsRef={controls} />
      <OrbitControls
        ref={controls}
        target={camera?.target ?? [0, 3.0, 0]}
        enablePan={false}
        enableDamping
        minDistance={3}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 - 0.06}
        autoRotate={auto && !focus && !camera}
        autoRotateSpeed={0.6}
        onStart={() => {
          setAuto(false);
          goal.current = null;
        }}
      />
    </Canvas>
  );
}
