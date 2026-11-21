import { z } from "zod";
import { cleanPhotoRef } from "./photo";
import { DOOR_COUNT, publicCalendarSchema, safeUrl, type PublicCalendar } from "./schema";

// A calendar travels inside its own share link, so opening one needs no account and no server:
// the data is JSON, deflate-compressed when the browser can, then base64url, kept in the URL fragment
// (which is never sent to a server). Format: first character 'z' = compressed, 'r' = raw, then the data.

export type ShareDoor = { body: string; link: string; photo?: string };
export type ShareInput = { title: string; recipientName: string; closingNote: string; doors: readonly ShareDoor[] };

const payloadSchema = z.object({
  v: z.literal(1),
  t: z.string().max(120),
  n: z.string().trim().min(1).max(80),
  c: z.string().max(600).default(""),
  // [message, link, photo reference]. The photo is optional so older links keep working.
  d: z.array(z.tuple([z.string().max(600), z.string().max(2000)]).rest(z.string().max(300))).length(DOOR_COUNT),
});

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, transform: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const canCompress = () => typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

/** Packs a calendar into a string for the share link's fragment. Throws if a field is too long. */
export async function encodeCalendar(input: ShareInput): Promise<string> {
  const payload = payloadSchema.parse({
    v: 1,
    t: input.title,
    n: input.recipientName,
    c: input.closingNote,
    d: input.doors.map((d) => [d.body, d.link, d.photo ?? ""]),
  });
  const raw = enc.encode(JSON.stringify(payload));
  if (canCompress()) {
    try {
      return "z" + toBase64Url(await pipe(raw, new CompressionStream("deflate-raw")));
    } catch {
      /* fall through to raw */
    }
  }
  return "r" + toBase64Url(raw);
}

async function slugFor(fragment: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(fragment)));
  return "s" + toBase64Url(digest).slice(0, 11);
}

/** Reads a share-link fragment back into a calendar, or null if it is damaged or not ours. */
export async function decodeCalendar(fragment: string): Promise<PublicCalendar | null> {
  const clean = fragment.replace(/^#/, "").trim();
  if (clean.length < 2) return null;
  try {
    const bytes = fromBase64Url(clean.slice(1));
    let raw: Uint8Array;
    if (clean[0] === "z") {
      if (!canCompress()) return null;
      raw = await pipe(bytes, new DecompressionStream("deflate-raw"));
    } else if (clean[0] === "r") {
      raw = bytes;
    } else {
      return null;
    }
    const p = payloadSchema.parse(JSON.parse(dec.decode(raw)));
    return publicCalendarSchema.parse({
      slug: await slugFor(clean),
      title: p.t.trim() || `A calendar for ${p.n}`,
      recipientName: p.n,
      closingNote: p.c.trim() || null,
      occasion: "Christmas",
      theme: "kettuvallam",
      language: "en",
      doors: p.d.map(([body, link, photo], i) => {
        const url = link.trim() ? safeUrl.safeParse(link) : null;
        return {
          number: i + 1,
          body,
          linkUrl: url?.success ? url.data : null,
          photoPath: cleanPhotoRef(photo) || null,
          source: "manual" as const,
        };
      }),
    });
  } catch {
    return null;
  }
}
