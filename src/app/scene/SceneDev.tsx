"use client";

import { useState } from "react";
import Scene from "@/components/scene/SceneLoader";
import type { SceneProps } from "@/components/scene/Scene";
import { tryOpen } from "@/lib/progress-core";

// Developer viewer for the boat: drag the slider to scrub the whole story. Not served in production.
export default function SceneDev() {
  const [opened, setOpened] = useState(0);
  const [camera] = useState<SceneProps["camera"]>(() => {
    if (typeof window === "undefined") return undefined;
    const v = new URLSearchParams(window.location.search).get("cam")?.split(",").map(Number);
    return v && v.length === 6 && v.every(Number.isFinite)
      ? { pos: [v[0], v[1], v[2]], target: [v[3], v[4], v[5]] }
      : undefined;
  });
  const [wobble, setWobble] = useState<{ n: number; tick: number } | null>(null);

  function onGift(n: number) {
    const r = tryOpen(opened, n);
    if (r.ok) setOpened(r.opened);
    else setWobble((w) => ({ n, tick: (w?.tick ?? 0) + 1 }));
  }

  return (
    <main className="fixed inset-0">
      <Scene progress={opened} opened={opened} onGiftClick={onGift} wobble={wobble} camera={camera} />
      <div className="glass absolute top-4 left-4 flex items-center gap-3 rounded-full px-5 py-3 text-sm">
        <label htmlFor="opened">Doors opened: {opened}</label>
        <input
          id="opened"
          type="range"
          min={0}
          max={24}
          value={opened}
          onChange={(e) => setOpened(Number(e.target.value))}
          className="accent-[#e2b862]"
        />
      </div>
    </main>
  );
}
