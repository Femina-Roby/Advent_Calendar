"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  varying vec3 vDir;
  void main() {
    float t = smoothstep(0.0, 0.55, vDir.y);
    vec3 col = mix(uHorizon, uTop, t);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Sky dome: a vertical gradient from the horizon colour (matches the fog) up to a deeper top colour. */
export function Sky({ top, horizon }: { top: string; horizon: string }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() } },
      }),
    [],
  );

  useEffect(() => {
    material.uniforms.uTop.value.set(top);
    material.uniforms.uHorizon.value.set(horizon);
  }, [material, top, horizon]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh renderOrder={-1} material={material}>
      <sphereGeometry args={[180, 24, 16]} />
    </mesh>
  );
}
