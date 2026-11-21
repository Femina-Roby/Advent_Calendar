"use client";

import { Suspense, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// A wrapped present: the thing you actually receive when a gift object opens.
const WRAP = [
  { box: "#9b2c2c", ribbon: "#e7cf8e" },
  { box: "#1e4d3a", ribbon: "#d9b24f" },
  { box: "#d9b24f", ribbon: "#9b2c2c" },
  { box: "#efe3c8", ribbon: "#1e4d3a" },
] as const;

export function GiftBox({ variant }: { variant: number }) {
  const w = WRAP[variant % WRAP.length];
  const mat = (c: string) => <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.28} roughness={0.55} />;
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.24, 0.21, 0.24]} />
        {mat(w.box)}
      </mesh>
      {/* Ribbon: two bands crossing over the box. */}
      <mesh>
        <boxGeometry args={[0.05, 0.215, 0.245]} />
        {mat(w.ribbon)}
      </mesh>
      <mesh>
        <boxGeometry args={[0.245, 0.215, 0.05]} />
        {mat(w.ribbon)}
      </mesh>
      {/* Bow. */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.05, 0.135, 0]} rotation={[0, 0, s * 0.7]} scale={[1, 0.55, 0.7]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          {mat(w.ribbon)}
        </mesh>
      ))}
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        {mat(w.ribbon)}
      </mesh>
    </group>
  );
}

/** A polaroid: the photo on the door, framed, with a gold ribbon. Shown on both sides so it can turn. */
function PhotoGift({ url }: { url: string }) {
  const tex = useTexture(url);
  const img = tex.image as { width?: number; height?: number } | undefined;
  const aspect = img?.width && img?.height ? img.width / img.height : 1;
  const max = 0.38;
  const w = aspect >= 1 ? max : max * aspect;
  const h = aspect >= 1 ? max / aspect : max;
  return (
    <group rotation={[0, 0, 0.07]}>
      <mesh castShadow>
        <boxGeometry args={[w + 0.06, h + 0.11, 0.02]} />
        <meshStandardMaterial color="#f8f3e6" emissive="#f8f3e6" emissiveIntensity={0.3} roughness={0.7} />
      </mesh>
      {[0, Math.PI].map((r) => (
        <mesh key={r} position={[0, 0.025, r === 0 ? 0.0115 : -0.0115]} rotation={[0, r, 0]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, (h + 0.11) / 2, 0]}>
        <boxGeometry args={[0.06, 0.04, 0.03]} />
        <meshStandardMaterial color="#c9a24b" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** A sealed envelope: a link waiting inside. */
function LinkGift() {
  const flap = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.15, 0.1);
    s.lineTo(0.15, 0.1);
    s.lineTo(0, -0.02);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  return (
    <group rotation={[0, 0, -0.05]}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.2, 0.02]} />
        <meshStandardMaterial color="#f3ead2" emissive="#f3ead2" emissiveIntensity={0.3} roughness={0.8} />
      </mesh>
      {[0.0115, -0.0115].map((z) => (
        <mesh key={z} geometry={flap} position={[0, 0, z]} rotation={[0, z > 0 ? 0 : Math.PI, 0]}>
          <meshStandardMaterial color="#e6d6ae" emissive="#e6d6ae" emissiveIntensity={0.25} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, -0.015, 0.02]}>
        <sphereGeometry args={[0.034, 12, 10]} />
        <meshStandardMaterial color="#b8352c" emissive="#b8352c" emissiveIntensity={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** The thing you receive: a polaroid for a photo, an envelope for a link, a wrapped present for words. */
export function RevealItem({ variant, photo, hasLink }: { variant: number; photo: string | null; hasLink: boolean }) {
  if (photo) {
    return (
      <Suspense fallback={<GiftBox variant={variant} />}>
        <PhotoGift url={photo} />
      </Suspense>
    );
  }
  if (hasLink) return <LinkGift />;
  return <GiftBox variant={variant} />;
}
