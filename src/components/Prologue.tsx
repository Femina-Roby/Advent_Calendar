"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { copy } from "@/lib/copy";
import { useTypewriter } from "@/lib/use-typewriter";
import { Button } from "./ui/Button";
import { StarLantern } from "./ui/StarLantern";

// Shown once per browser session, over the landing page. The 3D boat loads behind it, so this is the
// loading screen too. It is on the landing page only: someone receiving a gift never sees it first.
const KEY = "adv-prologue-seen";
const listeners = new Set<() => void>();

function readSeen() {
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* it will simply show again */
  }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const FULL = copy.prologue.body + copy.prologue.closing;

export function Prologue() {
  const seen = useSyncExternalStore(subscribe, readSeen, () => false);
  const [leaving, setLeaving] = useState(false);
  const typed = useTypewriter(FULL, 18, !seen);
  const done = typed.length >= FULL.length;

  const finish = useCallback(() => {
    setLeaving(true);
    setTimeout(markSeen, 800);
  }, []);

  // After the last word, linger a moment, then go on by itself.
  useEffect(() => {
    if (!done || seen) return;
    const t = setTimeout(finish, 4000);
    return () => clearTimeout(t);
  }, [done, seen, finish]);

  if (seen) return null;

  const body = typed.slice(0, copy.prologue.body.length);
  const closing = typed.slice(copy.prologue.body.length);

  return (
    <div
      role="dialog"
      aria-label={copy.prologue.eyebrow}
      className={`sky-backdrop fixed inset-0 z-50 grid place-items-center px-7 transition-opacity duration-[800ms] ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <div className="max-w-xl">
        <StarLantern size={40} className="anim-fade" />
        <p className="eyebrow anim-fade mt-6">{copy.prologue.eyebrow}</p>
        {/* The full text is for screen readers; the typed copy is for eyes. */}
        <p className="sr-only">{FULL}</p>
        <p aria-hidden className="mt-6 min-h-[16rem] font-serif text-[1.45rem] leading-[1.65] font-light text-cream/90 italic md:min-h-[13rem] md:text-[1.7rem]">
          {body}
          <span className="text-gold-bright">{closing}</span>
          {!done ? <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse bg-gold" /> : null}
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Button onClick={finish} className={`transition-opacity duration-700 ${done ? "opacity-100" : "pointer-events-none opacity-0"}`} tabIndex={done ? 0 : -1}>
            {copy.prologue.enter}
          </Button>
        </div>
      </div>
      <Button variant="quiet" size="sm" onClick={finish} className="absolute right-5 bottom-5 md:right-10 md:bottom-8">
        {copy.prologue.skip}
      </Button>
    </div>
  );
}
