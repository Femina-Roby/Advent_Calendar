"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GiftState } from "@/components/ui/GiftTag";
import type { GiftSpec } from "@/lib/gifts";
import { RevealItem } from "./GiftBox";
import { photoUrl } from "@/lib/storage";
import { KINDS } from "./GiftKinds";
import { noMirror } from "./mirror";

const TAG: Record<GiftState, { fill: string; border: string; text: string }> = {
  locked: { fill: "#f6eedc", border: "#7a5a3a", text: "#3a2a1a" },
  next: { fill: "#f2a93b", border: "#143528", text: "#143528" },
  opened: { fill: "#e7cf8e", border: "#7a5a3a", text: "#143528" },
};

/** A big, high-contrast numbered tag drawn onto a canvas. Shown as a sprite, so there is no DOM overlay. */
function makeTagTexture(number: number, state: GiftState, fontFamily: string) {
  const size = 192;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const { fill, border, text } = TAG[state];
  g.fillStyle = fill;
  g.strokeStyle = border;
  g.lineWidth = 12;
  g.beginPath();
  g.roundRect(10, 10, size - 20, size - 20, 40);
  g.fill();
  g.stroke();
  g.fillStyle = text;
  g.font = `800 ${number > 9 ? 104 : 120}px ${fontFamily || "Georgia, serif"}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(number), size / 2, size / 2 + 8);
  if (state === "locked") {
    g.fillStyle = "#c9722b";
    g.fillRect(132, 26, 28, 22);
    g.strokeStyle = "#c9722b";
    g.lineWidth = 6;
    g.beginPath();
    g.arc(146, 26, 9, Math.PI, 0);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Soft round glow used for the pulsing halo and the opening burst. */
function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,226,150,1)");
  grad.addColorStop(0.4, "rgba(255,190,90,0.55)");
  grad.addColorStop(1, "rgba(255,170,60,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Waits until web fonts are ready, then returns the display font stack to draw tags with. */
function useTagFont() {
  const [font, setFont] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      if (!live) return;
      const stack = getComputedStyle(document.documentElement).getPropertyValue("--font-fraunces").trim();
      setFont(stack || "Georgia, serif");
    });
    return () => {
      live = false;
    };
  }, []);
  return font;
}

const TAG_SIZE: Record<GiftState, number> = { locked: 0.032, next: 0.05, opened: 0.027 };

type Props = {
  number: number;
  spec: GiftSpec;
  state: GiftState;
  /** Bumps each time a locked gift is tried out of order, to replay the wobble. */
  wobbleTick: number;
  onClick: (n: number) => void;
  /** What is inside: decides whether a polaroid, an envelope or a wrapped present floats out. */
  door?: { photoPath: string | null; linkUrl: string | null };
};

/** One gift: its own object, a number tag, a glow when it is next, and a wrapped present once opened. */
export function GiftMarker({ number, spec, state, wobbleTick, onClick, door }: Props) {
  const open = useRef(state === "opened" ? 1 : 0);
  const root = useRef<THREE.Group>(null);
  const reveal = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Sprite>(null);
  const burst = useRef<THREE.Sprite>(null);
  const tag = useRef<THREE.Sprite>(null);
  const wobbleStart = useRef(-1);
  const font = useTagFont();
  const tex = useMemo(() => (font ? makeTagTexture(number, state, font) : null), [font, number, state]);
  const glowTex = useMemo(() => makeGlowTexture(), []);
  const Kind = KINDS[spec.kind];

  useEffect(() => () => tex?.dispose(), [tex]);
  useEffect(() => () => glowTex.dispose(), [glowTex]);
  useEffect(() => {
    const sprite = tag.current;
    if (!sprite) return;
    noMirror.add(sprite);
    return () => {
      noMirror.delete(sprite);
    };
  }, [tex]);
  useEffect(() => {
    if (wobbleTick > 0) wobbleStart.current = performance.now();
  }, [wobbleTick]);

  useFrame(({ clock }, dt) => {
    const target = state === "opened" ? 1 : 0;
    open.current += (target - open.current) * Math.min(1, dt * 3.5);
    if (Math.abs(target - open.current) < 0.003) open.current = target;
    const o = open.current;
    const t = clock.elapsedTime;

    if (halo.current) {
      // Every unopened gift shimmers faintly so it can be spotted; the next one glows and pulses.
      halo.current.visible = state !== "opened";
      halo.current.material.opacity = state === "next" ? 0.85 : 0.3;
      halo.current.scale.setScalar(state === "next" ? 1.0 + Math.sin(t * 3) * 0.18 : 0.8 + Math.sin(t * 1.6 + number) * 0.08);
    }
    if (burst.current) {
      const b = Math.sin(Math.PI * o);
      burst.current.visible = b > 0.02;
      burst.current.scale.setScalar(0.6 + o * 2.2);
      burst.current.material.opacity = b * 0.9;
    }
    if (tag.current) {
      const base = TAG_SIZE[state];
      tag.current.scale.setScalar(state === "next" ? base * (1 + Math.sin(t * 3) * 0.07) : base);
    }
    if (reveal.current) {
      // The present rises out of the opened object, then floats and turns slowly.
      const r = Math.min(1, Math.max(0, (o - 0.4) / 0.6));
      const e = 1 - Math.pow(1 - r, 3);
      reveal.current.visible = r > 0.01;
      reveal.current.scale.setScalar(e);
      reveal.current.position.set(spec.rv[0], spec.rv[1] - (1 - e) * 0.25 + Math.sin(t * 1.5 + number) * 0.04, spec.rv[2]);
      reveal.current.rotation.y = t * 0.7;
    }
    const g = root.current;
    if (g) {
      const age = wobbleStart.current < 0 ? 1 : (performance.now() - wobbleStart.current) / 500;
      g.rotation.y = spec.rotY;
      g.rotation.z = age < 1 ? Math.sin(age * Math.PI * 6) * 0.12 * (1 - age) : 0;
    }
  });

  const fire = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onClick(number);
  };

  return (
    <group position={[spec.pos[0], spec.pos[1], spec.pos[2]]}>
      <group ref={root} rotation={[0, spec.rotY, 0]}>
        <Kind open={open} />
        <group ref={reveal} visible={false}>
          {state === "opened" ? <RevealItem variant={number} photo={photoUrl(door?.photoPath)} hasLink={Boolean(door?.linkUrl)} /> : null}
        </group>
      </group>

      {/* Glow when next, and a burst of light as it opens. */}
      <sprite ref={halo} position={[0, spec.hy, 0]} visible={false}>
        <spriteMaterial map={glowTex} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
      </sprite>
      <sprite ref={burst} position={[0, spec.hy, 0]} visible={false}>
        <spriteMaterial map={glowTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
      </sprite>

      {/* Click area, larger than the object so small things are easy to tap. */}
      <mesh
        position={[0, spec.hy, 0]}
        onClick={fire}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <sphereGeometry args={[spec.hr, 10, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* Number tag: constant size on screen, so it stays readable at any distance. The next one is always on top. */}
      {tex ? (
        <sprite ref={tag} position={[0, spec.tagY + 0.2, 0]} scale={[TAG_SIZE[state], TAG_SIZE[state], 1]} renderOrder={state === "next" ? 20 : 5} onClick={fire}>
          <spriteMaterial
            map={tex}
            transparent
            sizeAttenuation={false}
            depthTest={state !== "next"}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </sprite>
      ) : null}
    </group>
  );
}
