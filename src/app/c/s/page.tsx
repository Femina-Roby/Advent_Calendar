"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Opener } from "@/components/Opener";
import { btn } from "@/components/ui/Button";
import { StarLantern } from "@/components/ui/StarLantern";
import { copy } from "@/lib/copy";
import type { PublicCalendar } from "@/lib/schema";
import { decodeCalendar } from "@/lib/share";

type State = { status: "loading" } | { status: "ok"; calendar: PublicCalendar } | { status: "bad" };

/** A calendar that lives inside its own link: /c/s#<packed calendar>. No account, no server lookup. */
export default function SharedCalendarPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let live = true;
    decodeCalendar(window.location.hash).then((calendar) => {
      if (live) setState(calendar ? { status: "ok", calendar } : { status: "bad" });
    });
    return () => {
      live = false;
    };
  }, []);

  if (state.status === "ok") return <Opener calendar={state.calendar} />;

  return (
    <main className="sky-backdrop grid min-h-screen place-items-center px-5" aria-busy={state.status === "loading"}>
      <div className="glass glass-gold anim-rise w-full max-w-md rounded-3xl p-9 text-center">
        <StarLantern size={64} lit={state.status === "loading"} className={`mx-auto ${state.status === "loading" ? "animate-pulse" : "opacity-60"}`} />
        {state.status === "bad" ? (
          <>
            <h1 className="mt-6 text-2xl font-light">{copy.states.notReady}</h1>
            <p className="mt-3 text-dim">This link looks incomplete. Ask whoever sent it to share it again.</p>
            <Link href="/" className={btn("glass", "md", "mt-7")}>
              Back to the start
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
