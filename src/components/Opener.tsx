"use client";

import Link from "next/link";
import { useState } from "react";
import { copy } from "@/lib/copy";
import { tryOpen } from "@/lib/progress-core";
import { useProgress } from "@/lib/progress";
import { photoUrl } from "@/lib/storage";
import { useTween } from "@/lib/use-tween";
import { supportsWebGL } from "@/lib/webgl";
import { DOOR_COUNT, type PublicCalendar } from "@/lib/schema";
import SceneLoader from "./scene/SceneLoader";
import { Button } from "./ui/Button";
import { DoorPanel } from "./ui/DoorPanel";
import { StarLantern } from "./ui/StarLantern";
import { Toast } from "./ui/Toast";

type Refusal = { needed: number; target: number; tick: number };

/** Recipient experience: the 3D houseboat, opened one gift at a time, strictly in order. */
export function Opener({ calendar }: { calendar: PublicCalendar }) {
  const { opened, ready, finished, advance, reset } = useProgress(calendar.slug);
  const progress = useTween(opened);
  const [started, setStarted] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [focus, setFocus] = useState<{ n: number; tick: number } | null>(null);
  const [webgl] = useState(() => supportsWebGL());

  if (!ready) return <main className="min-h-screen" aria-busy="true" />;

  if (!webgl) {
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-xl place-items-center px-4">
        <div className="kasavu w-full p-8 text-center">
          <StarLantern size={72} lit={false} className="mx-auto" />
          <h1 className="mt-4 text-2xl font-semibold">{copy.states.noWebglTitle}</h1>
          <p className="mt-2 text-ink-soft">{copy.states.noWebgl}</p>
        </div>
      </main>
    );
  }

  if (!started) {
    const label = opened > 0 && !finished ? copy.intro.continueAt(opened + 1) : copy.intro.begin;
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-xl place-items-center px-4">
        <div className="kasavu anim-slide-in w-full p-8 text-center">
          <StarLantern size={80} className="mx-auto" />
          <h1 className="mt-4 text-3xl font-semibold">{copy.intro.title(calendar.recipientName)}</h1>
          <p className="mt-2 text-ink-soft">{calendar.title}</p>
          <Button
            className="mt-8"
            onClick={() => {
              setStarted(true);
              flyTo(Math.min(DOOR_COUNT, opened + 1));
            }}
          >
            {label}
          </Button>
        </div>
      </main>
    );
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

  function flyTo(n: number) {
    setFocus((prev) => ({ n, tick: (prev?.tick ?? 0) + 1 }));
  }

  const door = viewing ? calendar.doors[viewing - 1] : null;
  const showFinale = finished && viewing === null;
  const next = Math.min(DOOR_COUNT, opened + 1);

  return (
    <main className="fixed inset-0">
      <SceneLoader
        progress={progress}
        opened={opened}
        onGiftClick={handleDoor}
        wobble={refusal ? { n: refusal.target, tick: refusal.tick } : null}
        focus={focus}
        doors={calendar.doors}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 md:p-6">
        <div className="kasavu px-4 py-2">
          <h1 className="text-xl font-semibold">{copy.scene.forName(calendar.recipientName)}</h1>
        </div>
        <div className="kasavu grid place-items-center p-2" aria-label={copy.scene.progress(opened)}>
          <StarLantern size={56} progress={opened} />
        </div>
      </div>

      {showFinale ? (
        <section
          className="kasavu anim-slide-in fixed top-1/2 left-1/2 z-20 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 p-8 text-center"
          aria-live="polite"
        >
          <StarLantern size={88} className="mx-auto" />
          <h2 className="mt-4 text-2xl font-semibold">{copy.finale.title}</h2>
          {calendar.closingNote ? <p className="mt-3 font-serif text-xl leading-relaxed">{calendar.closingNote}</p> : null}
          <Link
            href="/make"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-green px-5 text-paper shadow-[inset_0_0_0_1px_var(--gold)]"
          >
            {copy.finale.cta}
          </Link>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-wrap items-center justify-center gap-3 border-t border-paper-3 bg-paper/95 px-4 py-4 backdrop-blur">
        {!finished ? <Button onClick={() => handleDoor(next)}>{copy.scene.openDoor(next)}</Button> : null}
        {!finished ? (
          <Button variant="ghost" onClick={() => flyTo(next)}>
            {copy.scene.turnToGift}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={reset}>
          {copy.scene.startOver}
        </Button>
        <Link
          href="/make"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-paper-2 px-5 text-base font-medium text-ink hover:bg-paper-3"
        >
          {copy.scene.makeYourOwn}
        </Link>
      </div>

      {door ? (
        <DoorPanel
          number={door.number}
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
    </main>
  );
}
