import premade from "@/fixtures/premade.json";
import { publicCalendarSchema, type PublicCalendar } from "./schema";

export const PREMADE_SLUG = "premade";

/**
 * Loads a calendar by slug. The premade calendar always comes from the bundled fixture,
 * so it works with no database and no network. Database lookup is added in a later ticket.
 */
export async function getCalendar(slug: string): Promise<PublicCalendar | null> {
  if (slug === PREMADE_SLUG) return publicCalendarSchema.parse(premade);
  return null;
}
