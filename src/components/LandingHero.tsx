"use client";

import Link from "next/link";
import premade from "@/fixtures/premade.json";
import { btn } from "./ui/Button";
import { ArrowRightIcon, SparkleIcon } from "./ui/icons";
import { StarLantern } from "./ui/StarLantern";
import SceneLoader from "./scene/SceneLoader";

const noop = () => {};

/** The landing page: the real boat, turning slowly in its finished winter state, with the invitation over it. */
export function LandingHero() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-night">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <SceneLoader progress={24} opened={24} onGiftClick={noop} doors={premade.doors} decorative />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgb(7 14 29 / 0.92) 0%, rgb(7 14 29 / 0.55) 42%, transparent 72%), linear-gradient(0deg, rgb(7 14 29 / 0.92) 0%, rgb(7 14 29 / 0.6) 42%, transparent 72%), linear-gradient(180deg, rgb(7 14 29 / 0.55) 0%, transparent 22%)",
        }}
        aria-hidden
      />

      <header className="relative z-10 flex items-center gap-3 px-6 pt-6 md:px-12 md:pt-9">
        <StarLantern size={30} />
        <span className="eyebrow !text-cream/80">Kettuvallam Advent</span>
      </header>

      <section className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col justify-end px-6 pb-14 md:justify-center md:px-12 md:pb-0">
        <div className="anim-rise max-w-xl">
          <p className="eyebrow">A Kerala advent calendar</p>
          <h1 className="mt-5 text-[3rem] leading-[1.02] font-light md:text-[5.25rem]">
            Twenty-four doors on the <em className="font-normal text-gold-bright">water.</em>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-dim">
            A houseboat drifts through a warm backwater night. Open a door whenever you like, and watch the world turn to winter.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/c/premade" className={btn("primary", "md")}>
              Open the calendar
              <ArrowRightIcon />
            </Link>
            <Link href="/make" className={btn("glass", "md")}>
              <SparkleIcon />
              Make one for someone
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 px-6 pb-6 text-xs tracking-wide text-faint md:absolute md:bottom-6 md:left-12 md:p-0">
        Made for Hackathoni · Alappuzha, 2026
      </footer>
    </main>
  );
}
