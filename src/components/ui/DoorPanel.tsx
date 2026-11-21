"use client";

import { useEffect, useRef } from "react";
import { copy } from "@/lib/copy";
import { btn } from "./Button";
import { ArrowUpRightIcon, CloseIcon } from "./icons";

type Props = {
  number: number;
  /** What the object is, e.g. "Brass teapot". */
  label: string;
  body: string;
  linkUrl?: string | null;
  photoUrl?: string | null;
  onClose: () => void;
};

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "the link";
  }
};

/** A letter: warm paper, set in serif. A side sheet on desktop, a bottom sheet on a phone. Esc closes it. */
export function DoorPanel({ number, label, body, linkUrl, photoUrl, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Door ${number}, ${label}`}
      className="letter anim-sheet fixed inset-x-0 bottom-0 z-30 max-h-[68vh] overflow-y-auto rounded-t-[1.75rem] px-6 pt-3 pb-8 outline-none md:inset-x-auto md:top-6 md:right-6 md:bottom-auto md:max-h-[calc(100vh-8.5rem)] md:w-[27rem] md:rounded-[1.5rem] md:px-8 md:pt-8"
    >
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#22332a]/20 md:hidden" aria-hidden />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-semibold tracking-[0.24em] text-[#9a7424] uppercase">
            Door {String(number).padStart(2, "0")}
          </p>
          <p className="mt-1 font-serif text-sm text-paper-dim italic">{label}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.scene.close}
          className="-mt-1 -mr-2 grid size-10 place-items-center rounded-full text-paper-dim transition hover:bg-[#22332a]/[0.07] hover:text-paper-ink"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="my-5 h-px bg-gradient-to-r from-[#b98a3a]/60 via-[#b98a3a]/25 to-transparent" aria-hidden />

      <p aria-live="polite" className="font-serif text-[1.375rem] leading-[1.5] text-paper-ink">
        {body}
      </p>

      {photoUrl ? (
        <figure className="relative mx-auto mt-7 w-[88%] -rotate-[1.2deg] bg-white p-2.5 pb-9 shadow-[0_14px_30px_-12px_rgb(0_0_0/0.45)]">
          <span
            aria-hidden
            className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[2deg] bg-[#e2b862]/55 shadow-sm"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt={`Photo for door ${number}`} className="max-h-72 w-full object-cover" />
        </figure>
      ) : null}

      {linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={btn("letter", "md", "mt-7 w-full justify-between")}
        >
          <span>
            Open <span className="font-semibold">{host(linkUrl)}</span>
          </span>
          <ArrowUpRightIcon />
        </a>
      ) : null}
    </div>
  );
}
