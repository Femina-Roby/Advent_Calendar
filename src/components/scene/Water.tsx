"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { WATER_Y } from "@/lib/boat-dims";
import { noMirror } from "./mirror";
import { MOON_POS } from "./Night";

// Water with real waves: a few travelling sine waves move the surface (and give exact normals), the boat,
// lights and sky are mirrored in it through a planar reflection that the waves then distort, a Fresnel term
// blends reflection with the deep colour, and the moon's reflection becomes a sparkling path of light.
const WAVES = /* glsl */ `
  void addWave(vec2 p, float t, vec2 dir, float lambda, float amp, float speed, inout float h, inout vec2 grad) {
    float k = 6.2831853 / lambda;
    float ph = dot(dir, p) * k + t * speed;
    h += amp * sin(ph);
    grad += amp * k * cos(ph) * dir;
  }
  void waves(vec2 p, float t, out float h, out vec2 grad) {
    h = 0.0;
    grad = vec2(0.0);
    addWave(p, t, normalize(vec2(1.0, 0.3)), 16.0, 0.075, 0.9, h, grad);
    addWave(p, t, normalize(vec2(-0.4, 1.0)), 10.0, 0.055, 1.1, h, grad);
    addWave(p, t, normalize(vec2(0.8, -0.7)), 6.0, 0.032, 1.5, h, grad);
    addWave(p, t, normalize(vec2(-0.9, -0.3)), 3.4, 0.018, 1.9, h, grad);
  }
`;

const WaterShader = {
  name: "WaterShader",
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color("#173a5a") },
    uShallow: { value: new THREE.Color("#2a6a86") },
    uFogColor: { value: new THREE.Color("#16284a") },
    uFogDensity: { value: 0.01 },
    uMoonDir: { value: new THREE.Vector3(0, 1, 0) },
    uMoon: { value: 1 },
    uDistort: { value: 0.035 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    uniform float uTime;
    varying vec4 vUv;
    varying vec3 vWorld;
    ${WAVES}
    void main() {
      vec4 base = modelMatrix * vec4(position, 1.0);
      float h;
      vec2 g;
      waves(base.xz, uTime, h, g);
      vec3 pos = position;
      pos.z += h;
      vUv = textureMatrix * vec4(position, 1.0);
      vec4 wp = modelMatrix * vec4(pos, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec3 uDeep;
    uniform vec3 uShallow;
    uniform vec3 uFogColor;
    uniform float uFogDensity;
    uniform vec3 uMoonDir;
    uniform float uMoon;
    uniform float uDistort;
    varying vec4 vUv;
    varying vec3 vWorld;
    ${WAVES}
    void main() {
      float h;
      vec2 grad;
      waves(vWorld.xz, uTime, h, grad);
      float dist = length(cameraPosition - vWorld);
      // Fine ripples for sparkle, fading with distance so they don't shimmer on the horizon.
      float fade = clamp(1.0 - dist / 70.0, 0.15, 1.0);
      float dh;
      vec2 dg = vec2(0.0);
      dh = 0.0;
      addWave(vWorld.xz, uTime, normalize(vec2(0.7, 0.7)), 1.7, 0.012 * fade, 2.6, dh, dg);
      addWave(vWorld.xz, uTime, normalize(vec2(-0.8, 0.4)), 1.1, 0.008 * fade, 3.1, dh, dg);
      addWave(vWorld.xz, uTime, normalize(vec2(0.2, -0.9)), 0.7, 0.005 * fade, 3.6, dh, dg);
      grad += dg;

      vec3 N = normalize(vec3(-grad.x, 1.0, -grad.y));
      vec3 V = normalize(cameraPosition - vWorld);
      float cosT = clamp(dot(N, V), 0.0, 1.0);
      float fresnel = clamp(0.06 + 0.94 * pow(1.0 - cosT, 3.0), 0.0, 1.0);

      vec3 refl = texture2DProj(tDiffuse, vec4(vUv.xy + N.xz * uDistort * vUv.w, vUv.zw)).rgb;
      vec3 body = mix(uDeep, uShallow, clamp(h * 3.5 + 0.35, 0.0, 1.0) * 0.55);
      vec3 col = mix(body, refl, clamp(fresnel * 1.15, 0.0, 0.95));

      // Moon: a tight glitter plus a soft sheen along the reflected direction.
      vec3 R = reflect(-V, N);
      float s = max(dot(R, normalize(uMoonDir)), 0.0);
      col += vec3(1.0, 0.97, 0.88) * (pow(s, 900.0) * 7.0 + pow(s, 80.0) * 0.35) * uMoon;

      float ff = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
      col = mix(col, uFogColor, clamp(ff, 0.0, 1.0));
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

type Props = {
  color: string;
  fogColor: string;
  fogDensity: number;
  /** 0..1 strength of the moon's reflection. */
  moon: number;
  /** Size of the mirror image in pixels. Smaller is cheaper. */
  mirrorSize?: number;
};

export function Water({ color, fogColor, fogDensity, moon, mirrorSize = 512 }: Props) {
  const ref = useRef<Reflector>(null);
  const reflector = useMemo(() => {
    const r = new Reflector(new THREE.PlaneGeometry(360, 360, 200, 200), {
      textureWidth: mirrorSize,
      textureHeight: mirrorSize,
      clipBias: 0.003,
      shader: WaterShader,
    });
    r.rotation.x = -Math.PI / 2;
    r.position.y = WATER_Y;
    // Hide the number tags while the mirror image is drawn.
    const original = r.onBeforeRender;
    r.onBeforeRender = function (...args: Parameters<typeof original>) {
      noMirror.forEach((o) => {
        o.visible = false;
      });
      original.apply(this, args);
      noMirror.forEach((o) => {
        o.visible = true;
      });
    };
    return r;
  }, [mirrorSize]);

  useEffect(() => () => reflector.dispose(), [reflector]);

  useFrame(({ clock }) => {
    const m = ref.current?.material as THREE.ShaderMaterial | undefined;
    if (!m) return;
    const u = m.uniforms;
    u.uTime.value = clock.elapsedTime;
    u.uDeep.value.set(color);
    u.uShallow.value.set(color).offsetHSL(0, 0, 0.1);
    u.uFogColor.value.set(fogColor);
    u.uFogDensity.value = fogDensity;
    u.uMoonDir.value.copy(MOON_POS).normalize();
    u.uMoon.value = moon;
  });

  return <primitive ref={ref} object={reflector} />;
}
