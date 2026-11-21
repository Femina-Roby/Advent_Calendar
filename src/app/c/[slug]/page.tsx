import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Opener } from "@/components/Opener";
import { getCalendar, PREMADE_SLUG } from "@/lib/calendars";

// The premade calendar is pre-rendered from the bundled fixture, so it needs no database.
export function generateStaticParams() {
  return [{ slug: PREMADE_SLUG }];
}

async function CalendarContent({ params }: { params: PageProps<"/c/[slug]">["params"] }) {
  const { slug } = await params;
  const calendar = await getCalendar(slug);
  if (!calendar) notFound();
  return <Opener calendar={calendar} askName={slug === PREMADE_SLUG} />;
}

export default function CalendarPage({ params }: PageProps<"/c/[slug]">) {
  return (
    <Suspense fallback={<main className="min-h-screen" aria-busy="true" />}>
      <CalendarContent params={params} />
    </Suspense>
  );
}
