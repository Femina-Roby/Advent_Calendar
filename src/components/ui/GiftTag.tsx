// HTML version of the gift marker states. The 3D scene reuses these states for its tags.
export type GiftState = "locked" | "next" | "opened";

const styles: Record<GiftState, string> = {
  locked: "bg-paper-2 text-ink-soft border-paper-3",
  next: "bg-lantern text-green-deep border-gold anim-next",
  opened: "bg-gold-soft text-green-deep border-gold",
};

type Props = {
  number: number;
  state: GiftState;
  wobble?: boolean;
  onClick?: () => void;
};

export function GiftTag({ number, state, wobble, onClick }: Props) {
  return (
    <button
      id={`door-${number}`}
      type="button"
      onClick={onClick}
      aria-label={`Door ${number}, ${state === "next" ? "ready to open" : state}`}
      className={`relative grid size-11 place-items-center rounded-lg border font-serif text-lg font-semibold ${styles[state]} ${wobble ? "anim-wobble" : ""}`}
    >
      {state === "locked" ? (
        <span aria-hidden className="absolute -top-1 -right-1 text-[10px]">
          🔒
        </span>
      ) : null}
      {number}
    </button>
  );
}
