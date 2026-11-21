"use client";

import dynamic from "next/dynamic";
import { StarLantern } from "@/components/ui/StarLantern";

// The 3D scene is client-only and loaded on demand, so the rest of the page stays light.
const SceneLoader = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="sky-backdrop grid h-full w-full place-items-center">
      <StarLantern size={64} className="animate-pulse" />
    </div>
  ),
});

export default SceneLoader;
