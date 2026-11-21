"use client";

import Link from "next/link";
import { useState } from "react";
import { copy } from "@/lib/copy";
import { GIFTS } from "@/lib/gifts";
import { tryOpen } from "@/lib/progress-core";
import { useProgress } from "@/lib/progress";
import { photoUrl } from "@/lib/storage";
import { useTween } from "@/lib/use-tween";
import { supportsWebGL } from "@/lib/webgl";
import { DOOR_COUNT, type PublicCalendar } from "@/lib/schema";
import SceneLoader from "./scene/SceneLoader";
import { Button, btn } from "./ui/Button";
import { DoorPanel } from "./ui/DoorPanel";
import { CompassIcon, RestartIcon, SparkleIcon } from "./ui/icons";
import { StarLantern } from "./ui/StarLantern";
import { Toast } from "./ui/Toast";

type Refusal = { needed: number; target: number; tick: number };

const pad = (n: number) => String(n).padStart(2, "0");

/** Recipient experience: the 3D houseboat, opened one gift at a time, strictly in order. */
export function Opener({ calendar }: { calendar: PublicCalendar }) {
  const { opened, ready, finished, advance, reset } = useProgress(calendar.slug);
  const progress = useTween(opened);
  const [started, setStarted] = useState(false);
  const [introGone, setIntroGone] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [focus, setFocus] = useState<{ n: number; tick: number } | null>(null);
  const [webgl] = useState(() => supportsWebGL());

  if (!ready) return <main className="sky-backdrop min-h-screen" aria-busy="true" />;

  if (!webgl) {
    return (
      <main className="sky-backdrop grid min-h-screen place-items-center px-5">
        <div className="glass glass-gold anim-rise w-full max-w-md rounded-3xl p-8 text-center">
          <StarLantern size={64} lit={false} className="mx-auto opacity-70" />
          <h1 className="mt-5 text-2xl font-semibold">{copy.states.noWebglTitle}</h1>
          <p className="mt-2 text-dim">{copy.states.noWebgl}</p>
        </div>
      </main>
    );
  }

  function flyTo(n: number) {
    setFocus((prev) => ({ n, tick: (prev?.tick ?? 0) + 1 }));
  }

  function begin() {
    setStarted(true);
    flyTo(Math.min(DOOR_COUNT, opened + 1));
    setTimeout(() => setIntroGone(true), 900);
  }

  function handleDoor(n: number) {
    const result = tryOpen(opened, n);
    if (result.ok) {
      setRefusal(null);
      if (n > opened) advance(n);
      setViewing(n);
      flyTo(n);
    } else {
      setRefusal((prev) => ({ needed: result.needed, target: n, tick: (prev?.tick ?? 0) + 1 }));
    }
  }

  const door = viewing ? calendar.doors[viewing - 1] : null;
  const showFinale = finished && viewing === null;
  const next = Math.min(DOOR_COUNT, opened + 1);
  const resumeLabel = opened > 0 && !finished ? copy.intro.continueAt(opened + 1) : copy.intro.begin;
  const hasTitle = calendar.title.trim() && calendar.title !== `A calendar for ${calendar.recipientName}`;

  return (
    <main className="fixed inset-0 bg-night">
      <SceneLoader
        progress={progress}
        opened={opened}
        onGiftClick={handleDoor}
        wobble={refusal ? { n: refusal.target, tick: refusal.tick } : null}
        focus={focus}
        doors={calendar.doors}
        decorative={!started}
      />

      {/* Intro: the scene turns slowly behind it, so there is never a blank wait. */}
      {!introGone ? (
        <div
          aria-hidden={started}
          className={`absolute inset-0 z-30 grid place-items-center px-6 text-center transition-opacity duration-[900ms] ${started ? "pointer-events-none opacity-0" : "opacity-100"}`}
          style={{
            background:
              "radial-gradient(ellipse at 50% 48%, rgb(7 14 29 / 0.42) 0%, rgb(7 14 29 / 0.78) 80%), linear-gradient(180deg, rgb(7 14 29 / 0.4), transparent 28%, rgb(7 14 29 / 0.6))",
          }}
        >
          <div className="anim-rise max-w-2xl">
            <StarLantern size={52} className="mx-auto" />
            <p className="eyebrow mt-7">{copy.intro.eyebrow}</p>
            <h1 className="mt-4 text-[2.75rem] leading-[1.06] font-light [text-shadow:0_2px_30px_rgb(0_0_0/0.55)] md:text-7xl">
              A calendar for <em className="font-normal text-gold-bright">{calendar.recipientName}</em>
            </h1>
            {hasTitle ? <p className="mt-4 font-serif text-lg text-dim italic">{calendar.title}</p> : null}
            <div className="mx-auto my-8 h-px w-24 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" aria-hidden />
            <Button onClick={begin} tabIndex={started ? -1 : 0}>
              {resumeLabel}
            </Button>
            <p className="mt-5 text-sm text-faint">{copy.intro.hint}</p>
          </div>
        </div>
      ) : null}

      {started ? (
        <>
          {/* Top bar: who it is for, and how far along. */}
          <div className="anim-fade pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 md:p-6">
            <div className="glass flex items-center gap-3 rounded-full py-2 pr-5 pl-3">
              <StarLantern size={26} />
              <h1 className="font-serif text-lg leading-none text-cream">{copy.scene.forName(calendar.recipientName)}</h1>
            </div>
            <div className="glass flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-2" aria-label={copy.scene.progress(opened)}>
              <StarLantern size={34} progress={opened} />
              <p className="font-serif text-lg leading-none tabular-nums text-cream">
                {pad(opened)}
                <span className="text-faint"> / {DOOR_COUNT}</span>
              </p>
            </div>
          </div>

          {showFinale ? (
            <section
              className="glass glass-gold anim-rise fixed top-1/2 left-1/2 z-20 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] px-8 py-10 text-center"
              aria-live="polite"
            >
              <StarLantern size={76} className="mx-auto drop-shadow-[0_0_24px_rgb(242_169_59/0.6)]" />
              <p className="eyebrow mt-6">The last door</p>
              <h2 className="mt-3 text-3xl font-light">{copy.finale.title}</h2>
              {calendar.closingNote ? (
                <p className="mt-5 font-serif text-xl leading-relaxed text-cream/90 italic">{calendar.closingNote}</p>
              ) : null}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/make" className={btn("primary", "md")}>
                  <SparkleIcon />
                  {copy.finale.cta}
                </Link>
                <Button variant="glass" onClick={reset}>
                  {copy.scene.startOver}
                </Button>
              </div>
            </section>
          ) : null}

          {/* The dock: one clear action, the rest quiet. */}
          <nav
            aria-label="Calendar controls"
            className="anim-fade pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="glass glass-gold pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
              {!finished ? (
                <Button onClick={() => handleDoor(next)}>{copy.scene.openDoor(next)}</Button>
              ) : null}
              {!finished ? (
                <Button variant="quiet" size="icon" onClick={() => flyTo(next)} aria-label={copy.scene.turnToGift} title={copy.scene.turnToGift}>
                  <CompassIcon />
                </Button>
              ) : null}
              <Button variant="quiet" size="icon" onClick={reset} aria-label={copy.scene.startOver} title={copy.scene.startOver}>
                <RestartIcon />
              </Button>
              <Link href="/make" className={btn("quiet", "icon")} aria-label={copy.scene.makeYourOwn} title={copy.scene.makeYourOwn}>
                <SparkleIcon />
              </Link>
            </div>
          </nav>

          {door ? (
            <DoorPanel
              number={door.number}
              label={GIFTS[door.number - 1].label}
              body={door.body}
              linkUrl={door.linkUrl}
              photoUrl={photoUrl(door.photoPath)}
              onClose={() => setViewing(null)}
            />
          ) : null}
          {refusal ? (
            <Toast
              message={copy.refusal.message(refusal.needed)}
              actionLabel={copy.refusal.show}
              onAction={() => {
                flyTo(refusal.needed);
                setRefusal(null);
              }}
              onDismiss={() => setRefusal(null)}
            />
          ) : null}
        </>
      ) : null}
    </main>
  );
}
