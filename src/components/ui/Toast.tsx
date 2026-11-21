"use client";

import { Button } from "./Button";
import { CloseIcon } from "./icons";

type Props = { message: string; actionLabel?: string; onAction?: () => void; onDismiss: () => void };

/** A gentle refusal, never an error. Frosted glass above the dock, with one way forward. */
export function Toast({ message, actionLabel, onAction, onDismiss }: Props) {
  return (
    <div
      role="status"
      className="glass glass-gold anim-rise fixed bottom-28 left-1/2 z-40 flex w-[min(92vw,27rem)] -translate-x-1/2 items-center gap-3 rounded-2xl py-3 pr-2 pl-5"
    >
      <p className="flex-1 font-serif text-[1.05rem] leading-snug text-cream">{message}</p>
      {actionLabel && onAction ? (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="grid size-9 place-items-center rounded-full text-dim transition hover:bg-white/10 hover:text-cream"
      >
        <CloseIcon width={18} height={18} />
      </button>
    </div>
  );
}
