"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { seeded } from "./Weather";

/** Where the moon hangs. The scene's light comes from the same direction, so shadows agree with the sky. */
export const MOON_POS = new THREE.Vector3(32, 14, -42);

const starVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPx;
  uniform float uAlpha;
  varying float vA;
  varying vec3 vCol;
  void main() {
    float tw = 0.6 + 0.4 * sin(uTime * (1.0 + aPhase * 1.6) + aPhase * 40.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPx * (0.75 + 0.5 * tw);
    vA = tw * uAlpha;
    vCol = aColor;
  }
`;

const starFragment = /* glsl */ `
  varying float vA;
  varying vec3 vCol;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vCol * 1.35, a * vA);
  }
`;

/** A dome of twinkling stars in warm, white and blue tints, with a faint band of Milky Way. */
export function Stars({ alpha }: { alpha: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const data = useMemo(() => {
    const rnd = seeded(11);
    const bright = 1500;
    const band = 1100;
    const n = bright + band;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const phase = new Float32Array(n);
    const col = new Float32Array(n * 3);
    const tints = [new THREE.Color("#ffffff"), new THREE.Color("#ffe9c4"), new THREE.Color("#bcd4ff"), new THREE.Color("#ffffff")];
    const bandNormal = new THREE.Vector3(0.5, 0.45, 0.74).normalize();
    const R = 170;
    let i = 0;
    while (i < n) {
      const y = 0.02 + rnd() * 0.98;
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(1 - y * y);
      const d = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      const inBand = i >= bright;
      if (inBand && Math.abs(d.dot(bandNormal)) > 0.16) continue;
      pos.set([d.x * R, d.y * R, d.z * R], i * 3);
      size[i] = inBand ? 2.2 + rnd() * 2.2 : 3.2 + Math.pow(rnd(), 2.5) * 7.5;
      phase[i] = rnd();
      const c = inBand ? tints[2] : tints[Math.floor(rnd() * tints.length)];
      const k = inBand ? 0.55 : 1;
      col.set([c.r * k, c.g * k, c.b * k], i * 3);
      i++;
    }
    return { pos, size, phase, col };
  }, []);

  useFrame(({ clock }) => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uTime.value = clock.elapsedTime;
    m.uniforms.uAlpha.value = alpha;
  });

  return (
    <points
      renderOrder={-0.5}
      frustumCulled={false}
      onBeforeRender={(renderer) => {
        const m = mat.current;
        if (!m) return;
        const rt = renderer.getRenderTarget();
        m.uniforms.uPx.value = (rt ? rt.height : renderer.domElement.height) / 760;
        m.uniforms.uAlpha.value = alpha * (rt ? 0.22 : 1);
      }}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[data.size, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[data.phase, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[data.col, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={starVertex}
        fragmentShader={starFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
        uniforms={{ uTime: { value: 0 }, uPx: { value: dpr }, uAlpha: { value: alpha } }}
      />
    </points>
  );
}

function moonTextures() {
  const halo = document.createElement("canvas");
  halo.width = halo.height = 256;
  let g = halo.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(210,225,255,0.55)");
  grad.addColorStop(0.25, "rgba(150,180,255,0.22)");
  grad.addColorStop(1, "rgba(120,150,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);

  const disc = document.createElement("canvas");
  disc.width = disc.height = 256;
  g = disc.getContext("2d")!;
  g.beginPath();
  g.arc(128, 128, 44, 0, Math.PI * 2);
  g.fillStyle = "#fff7e0";
  g.fill();
  // A few soft craters.
  g.fillStyle = "rgba(190,175,140,0.35)";
  for (const [x, y, r] of [
    [112, 112, 11],
    [140, 128, 8],
    [120, 146, 9],
    [146, 106, 5],
  ] as const) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const t1 = new THREE.CanvasTexture(halo);
  const t2 = new THREE.CanvasTexture(disc);
  t1.colorSpace = t2.colorSpace = THREE.SRGBColorSpace;
  return { halo: t1, disc: t2 };
}

/** The moon: a pale disc with a soft blue halo. */
export function Moon({ alpha }: { alpha: number }) {
  const tex = useMemo(() => moonTextures(), []);
  useEffect(
    () => () => {
      tex.halo.dispose();
      tex.disc.dispose();
    },
    [tex],
  );
  return (
    <group position={MOON_POS}>
      <sprite scale={[46, 46, 1]} renderOrder={-0.4}>
        <spriteMaterial map={tex.halo} transparent opacity={alpha} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
      </sprite>
      <sprite scale={[15, 15, 1]} renderOrder={-0.3}>
        <spriteMaterial map={tex.disc} transparent opacity={Math.min(1, alpha * 1.4)} depthWrite={false} fog={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

const flyVertex = /* glsl */ `
  attribute float aPhase;
  uniform float uTime;
  uniform float uPx;
  uniform float uAlpha;
  varying float vA;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.4 + aPhase * 6.0) * 0.9;
    p.y += sin(uTime * 0.7 + aPhase * 9.0) * 0.35;
    p.z += cos(uTime * 0.35 + aPhase * 5.0) * 0.9;
    float blink = pow(max(0.0, sin(uTime * 1.3 + aPhase * 30.0)), 3.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = 7.0 * uPx * (0.35 + 0.65 * blink);
    vA = (0.25 + 0.75 * blink) * uAlpha;
  }
`;

const flyFragment = /* glsl */ `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(0.85, 1.0, 0.5, a * vA);
  }
`;

/** Fireflies drifting over the backwater, a Kerala night touch that fades as the cold sets in. */
export function Fireflies({ alpha }: { alpha: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const data = useMemo(() => {
    const rnd = seeded(23);
    const n = 90;
    const pos = new Float32Array(n * 3);
    const phase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = 3 + rnd() * 14;
      const a = rnd() * Math.PI * 2;
      pos.set([Math.cos(a) * r, 0.9 + rnd() * 3.4, Math.sin(a) * r], i * 3);
      phase[i] = rnd();
    }
    return { pos, phase };
  }, []);

  useFrame(({ clock }) => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uTime.value = clock.elapsedTime;
    m.uniforms.uAlpha.value = alpha;
  });

  if (alpha < 0.01) return null;
  return (
    <points
      frustumCulled={false}
      onBeforeRender={(renderer) => {
        const m = mat.current;
        if (!m) return;
        const rt = renderer.getRenderTarget();
        m.uniforms.uPx.value = (rt ? rt.height : renderer.domElement.height) / 760;
      }}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[data.phase, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={flyVertex}
        fragmentShader={flyFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uPx: { value: dpr }, uAlpha: { value: alpha } }}
      />
    </points>
  );
}
