"use client";

import { useEffect, useRef } from "react";
import { copy } from "@/lib/copy";
import { Button } from "./Button";

type Props = {
  number: number;
  body: string;
  linkUrl?: string | null;
  photoUrl?: string | null;
  onClose: () => void;
};

// Right-hand drawer on desktop, bottom sheet on phones. Closes on Escape, focuses itself on open.
export function DoorPanel({ number, body, linkUrl, photoUrl, onClose }: Props) {
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
      aria-label={`Door ${number}`}
      className="kasavu anim-slide-in fixed inset-x-3 bottom-3 z-30 max-h-[55vh] overflow-y-auto p-6 outline-none md:inset-x-auto md:top-6 md:right-6 md:bottom-auto md:max-h-[calc(100vh-8rem)] md:w-[24rem]"
    >
      <p className="font-serif text-sm tracking-widest text-coir uppercase">Door {number}</p>
      <p aria-live="polite" className="mt-3 font-serif text-xl leading-relaxed text-ink">
        {body}
      </p>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={`Photo for door ${number}`}
          className="mt-4 w-full rounded-md border-8 border-paper-2 object-cover shadow-md"
        />
      ) : null}
      {linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-paper-2 px-5 text-ink underline-offset-4 hover:underline"
        >
          Open the link
        </a>
      ) : null}
      <div className="mt-6">
        <Button variant="ghost" onClick={onClose}>
          {copy.scene.close}
        </Button>
      </div>
    </div>
  );
}
