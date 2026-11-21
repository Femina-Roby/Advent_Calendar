"use client";

import { useState } from "react";
import { copy } from "@/lib/copy";
import { sceneParams } from "@/lib/scene-params";
import { Button } from "@/components/ui/Button";
import { DoorPanel } from "@/components/ui/DoorPanel";
import { GiftTag, type GiftState } from "@/components/ui/GiftTag";
import { StarLantern } from "@/components/ui/StarLantern";
import { Toast } from "@/components/ui/Toast";

const swatches = [
  ["paper", "var(--paper)"],
  ["paper-2", "var(--paper-2)"],
  ["ink", "var(--ink)"],
  ["green", "var(--green)"],
  ["gold", "var(--gold)"],
  ["coir", "var(--coir)"],
  ["lantern", "var(--lantern)"],
  ["ice", "var(--ice)"],
  ["night", "var(--night)"],
] as const;

// Style kit: the look is reviewed here once, then frozen. Every later screen reuses these pieces.
export default function KitPage() {
  const [panel, setPanel] = useState(false);
  const [toast, setToast] = useState(false);
  const [wobble, setWobble] = useState(false);
  const [progress, setProgress] = useState(7);
  const states: GiftState[] = ["locked", "next", "opened"];
  const scene = sceneParams(progress);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-12 px-4 py-10 md:px-8">
      <header className="flex items-center gap-4">
        <StarLantern size={56} />
        <div>
          <h1 className="text-3xl font-semibold">{copy.appName} style kit</h1>
          <p className="text-ink-soft">Review on a phone once, then freeze.</p>
        </div>
      </header>

      <section aria-labelledby="colour">
        <h2 id="colour" className="mb-3 text-xl">Palette</h2>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
          {swatches.map(([name, value]) => (
            <div key={name} className="overflow-hidden rounded-lg border border-paper-3">
              <div className="h-14" style={{ background: value }} />
              <p className="px-2 py-1 text-xs">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="type">
        <h2 id="type" className="mb-3 text-xl">Type</h2>
        <div className="kasavu p-6">
          <h3 className="text-2xl font-semibold">{copy.intro.title("Anu")}</h3>
          <p className="mt-2 font-serif text-xl leading-relaxed">
            Door text is large because the message is the gift.
          </p>
          <p className="mt-2 text-base text-ink-soft">Body copy in the plain sans face.</p>
        </div>
      </section>

      <section aria-labelledby="buttons">
        <h2 id="buttons" className="mb-3 text-xl">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>{copy.intro.begin}</Button>
          <Button>{copy.scene.openDoor(8)}</Button>
          <Button variant="ghost">{copy.scene.turnToGift}</Button>
          <Button variant="ghost">{copy.scene.makeYourOwn}</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section aria-labelledby="gifts">
        <h2 id="gifts" className="mb-3 text-xl">Gift tag states</h2>
        <div className="flex flex-wrap items-center gap-4">
          {states.map((s, i) => (
            <GiftTag key={s} number={i + 6} state={s} wobble={s === "locked" && wobble} />
          ))}
          <Button
            variant="ghost"
            onClick={() => {
              setWobble(false);
              requestAnimationFrame(() => setWobble(true));
              setToast(true);
            }}
          >
            Try the locked tag
          </Button>
        </div>
      </section>

      <section aria-labelledby="progress">
        <h2 id="progress" className="mb-3 text-xl">Progress ring</h2>
        <div className="flex items-center gap-6">
          <StarLantern size={72} progress={progress} />
          <input
            type="range"
            min={0}
            max={24}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            aria-label="Progress"
            className="w-56 accent-gold"
          />
          <span className="font-serif text-lg">{copy.scene.progress(progress)}</span>
        </div>
        <div className="mt-6 overflow-hidden rounded-lg border border-paper-3">
          <div className="flex h-20">
            {[scene.waterColor, scene.fogColor, scene.lightColor].map((c, i) => (
              <div key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 bg-paper-2 p-4 text-sm md:grid-cols-4">
            <div><dt className="text-ink-soft">stage</dt><dd className="font-medium">{scene.stage}</dd></div>
            <div><dt className="text-ink-soft">mist</dt><dd>{scene.mist.toFixed(2)}</dd></div>
            <div><dt className="text-ink-soft">ice</dt><dd>{scene.ice.toFixed(2)}</dd></div>
            <div><dt className="text-ink-soft">roof snow</dt><dd>{scene.roofSnow.toFixed(2)}</dd></div>
            <div><dt className="text-ink-soft">snow flakes</dt><dd>{scene.snowCount}</dd></div>
            <div><dt className="text-ink-soft">trees</dt><dd>{scene.treeGrowth.toFixed(2)}</dd></div>
            <div><dt className="text-ink-soft">lanterns</dt><dd>{scene.lanternCount}</dd></div>
            <div><dt className="text-ink-soft">star lit</dt><dd>{scene.starLit ? "yes" : "no"}</dd></div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="panel">
        <h2 id="panel" className="mb-3 text-xl">Door panel and toast</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setPanel(true)}>Open door panel</Button>
          <Button variant="ghost" onClick={() => setToast(true)}>Show toast</Button>
        </div>
      </section>

      {panel ? (
        <DoorPanel
          number={7}
          body="Remember the night we got lost on the way to Kumarakom and ended up eating the best appam of our lives? This door is for that."
          linkUrl="https://example.com"
          onClose={() => setPanel(false)}
        />
      ) : null}
      {toast ? (
        <Toast
          message={copy.refusal.message(7)}
          actionLabel={copy.refusal.show}
          onAction={() => setToast(false)}
          onDismiss={() => setToast(false)}
        />
      ) : null}
    </main>
  );
}
