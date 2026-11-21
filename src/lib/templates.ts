import templates from "@/fixtures/templates.json";
import { DOOR_COUNT, type Door } from "./schema";

/** Offline fallback: 24 starter doors with the recipient's name filled in. */
export function templateDoors(recipientName: string): Door[] {
  const name = recipientName.trim() || "friend";
  return Array.from({ length: DOOR_COUNT }, (_, i) => ({
    number: i + 1,
    body: (templates[i] ?? "").replaceAll("{name}", name),
    linkUrl: null,
    photoPath: null,
    source: "template" as const,
  }));
}
