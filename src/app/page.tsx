import Link from "next/link";
import { copy } from "@/lib/copy";
import { StarLantern } from "@/components/ui/StarLantern";

export default function Home() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-xl place-items-center px-4">
      <div className="kasavu w-full p-8 text-center">
        <StarLantern size={72} className="mx-auto" />
        <h1 className="mt-4 text-3xl font-semibold">{copy.appName}</h1>
        <p className="mt-2 text-ink-soft">
          Twenty-four doors on a Kerala houseboat that freezes into winter.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/c/premade"
            className="inline-flex min-h-11 items-center rounded-full bg-green px-5 text-paper shadow-[inset_0_0_0_1px_var(--gold)]"
          >
            Open the premade calendar
          </Link>
          <Link href="/make" className="inline-flex min-h-11 items-center rounded-full bg-paper-2 px-5 text-ink hover:bg-paper-3">
            Make your own
          </Link>
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          Work in progress. <Link href="/kit" className="underline">Style kit</Link>
        </p>
      </div>
    </main>
  );
}
