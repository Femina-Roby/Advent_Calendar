import { z } from "zod";

export const DOOR_COUNT = 24;

/** http(s) only. Blocks javascript:, data:, file: and anything else. */
export const safeUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "Links must start with http:// or https://");

export const doorSource = z.enum(["sarvam", "template", "manual"]);

export const doorSchema = z.object({
  number: z.number().int().min(1).max(DOOR_COUNT),
  body: z.string().trim().max(600),
  linkUrl: safeUrl.nullable().default(null),
  /** Path inside the `door-photos` bucket. Build a URL with `photoUrl()` in lib/storage. */
  photoPath: z.string().max(300).nullable().default(null),
  source: doorSource.default("manual"),
});

/**
 * The one shape used by the fixture, the `get_calendar` RPC and the UI.
 * Doors must be exactly 24, numbered 1..24, each once, sorted.
 */
export const publicCalendarSchema = z.object({
  slug: z.string().regex(/^[A-Za-z0-9_-]{6,40}$/),
  title: z.string().trim().min(1).max(120),
  recipientName: z.string().trim().min(1).max(80),
  closingNote: z.string().trim().max(600).nullable().default(null),
  occasion: z.string().trim().max(80).default("Christmas"),
  theme: z.string().default("kettuvallam"),
  language: z.string().default("en"),
  doors: z.array(doorSchema).length(DOOR_COUNT),
}).superRefine((cal, ctx) => {
  cal.doors.forEach((d, i) => {
    if (d.number !== i + 1) {
      ctx.addIssue({
        code: "custom",
        path: ["doors", i, "number"],
        message: `Door at position ${i + 1} must be numbered ${i + 1}`,
      });
    }
  });
});

/** What the sender types in step 1 of the maker. Feeds the Sarvam prompt. */
export const draftInputSchema = z.object({
  recipientName: z.string().trim().min(1).max(80),
  relationship: z.string().trim().min(1).max(60),
  about: z.string().trim().max(1200).default(""),
  occasion: z.string().trim().max(80).default("Christmas"),
  mood: z.enum(["warm", "funny", "sentimental"]).default("warm"),
});

/** What we ask Sarvam to return for a batch of doors. */
export const draftBatchSchema = z.array(
  z.object({
    number: z.number().int().min(1).max(DOOR_COUNT),
    body: z.string().trim().min(1).max(600),
  }),
);

export type Door = z.infer<typeof doorSchema>;
export type DoorSource = z.infer<typeof doorSource>;
export type PublicCalendar = z.infer<typeof publicCalendarSchema>;
export type DraftInput = z.infer<typeof draftInputSchema>;
export type DraftBatch = z.infer<typeof draftBatchSchema>;
