"use client";

import { Button } from "./Button";

type Props = { message: string; actionLabel?: string; onAction?: () => void; onDismiss: () => void };

// Gentle refusal, never a red error.
export function Toast({ message, actionLabel, onAction, onDismiss }: Props) {
  return (
    <div
      role="status"
      className="kasavu anim-slide-in fixed bottom-24 left-1/2 z-40 flex w-[min(92vw,26rem)] -translate-x-1/2 items-center gap-3 px-5 py-4"
    >
      <p className="flex-1 font-serif text-base text-ink">{message}</p>
      {actionLabel && onAction ? (
        <Button variant="ghost" onClick={onAction} className="min-h-10 px-4 text-sm">
          {actionLabel}
        </Button>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="grid size-8 place-items-center rounded-full text-ink-soft hover:bg-paper-2"
      >
        ×
      </button>
    </div>
  );
}
