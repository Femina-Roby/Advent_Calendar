import Link from "next/link";
import { StarLantern } from "./StarLantern";

/** The masthead: set in the display serif, with the second word in italic gold, like a printed title. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Kettuvallam Advent, home" className={`inline-flex items-center gap-3 ${className}`}>
      <StarLantern size={28} />
      <span className="font-serif text-[1.4rem] leading-none tracking-tight text-cream">
        Kettuvallam <em className="font-normal text-gold-bright">Advent</em>
      </span>
    </Link>
  );
}
