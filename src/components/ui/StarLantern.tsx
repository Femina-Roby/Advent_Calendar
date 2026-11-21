// Kerala Christmas star lantern (paper star). Used as logo, progress ring and finale object.
type Props = { size?: number; lit?: boolean; progress?: number; className?: string };

const STAR =
  "50,6 59,34 86,24 70,48 94,62 66,64 62,92 50,70 38,92 34,64 6,62 30,48 14,24 41,34";

export function StarLantern({ size = 48, lit = true, progress, className }: Props) {
  const showRing = typeof progress === "number";
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = showRing ? (Math.min(24, Math.max(0, progress)) / 24) * c : 0;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={showRing ? `${progress} of 24 doors opened` : "Star lantern"}
    >
      {showRing && (
        <>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--paper-3)" strokeWidth="3" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--gold)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dasharray 0.7s var(--ease)" }}
          />
        </>
      )}
      <g transform={showRing ? "translate(14 14) scale(0.72)" : undefined}>
        <polygon
          points={STAR}
          fill={lit ? "var(--lantern)" : "var(--paper-3)"}
          stroke="var(--coir)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="50" r="9" fill={lit ? "var(--gold-soft)" : "var(--paper-2)"} />
      </g>
    </svg>
  );
}
