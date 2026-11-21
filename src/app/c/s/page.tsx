"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Opener } from "@/components/Opener";
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
    <main className="mx-auto grid min-h-screen w-full max-w-xl place-items-center px-4" aria-busy={state.status === "loading"}>
      <div className="kasavu w-full p-8 text-center">
        <StarLantern size={72} className={`mx-auto ${state.status === "loading" ? "animate-pulse" : ""}`} />
        {state.status === "bad" ? (
          <>
            <h1 className="mt-4 text-2xl font-semibold">{copy.states.notReady}</h1>
            <p className="mt-2 text-ink-soft">This link looks incomplete. Ask whoever sent it to share it again.</p>
            <Link href="/" className="mt-6 inline-block underline">
              Back to the start
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
