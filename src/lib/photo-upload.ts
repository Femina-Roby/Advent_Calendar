"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { localPhotoKey } from "./photo";
import { onlineStorageConfigured } from "./storage";

// Adding a photo from the device: shrink it in the browser first, then either upload it to the online
// bucket (shareable with anyone) or, if online storage isn't connected yet, keep it on this device only.
const MAX_ONLINE_BYTES = 350_000;

function randomId(bytes = 12): string {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  let s = "";
  for (const b of a) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Shrinks an image so it is light to send and to show on a phone. */
export async function shrinkImage(file: File, maxSide: number, maxBytes: number): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't a picture.");
  if (file.size > 25_000_000) throw new Error("That picture is too large. Try one under 25 MB.");
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error("Couldn't read that picture.");
  });
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  let blob: Blob | null = null;
  for (const q of [0.82, 0.7, 0.55, 0.42]) {
    blob = (await toBlob(canvas, "image/webp", q)) ?? (await toBlob(canvas, "image/jpeg", q));
    if (blob && blob.size <= maxBytes) break;
  }
  if (!blob) throw new Error("Couldn't prepare that picture.");
  return blob;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn't read that picture."));
    r.readAsDataURL(blob);
  });
}

let client: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  return client;
}

export type SavedPhoto = { ref: string; online: boolean };

/** Saves a photo and returns the short reference to keep on the door. */
export async function savePhoto(file: File, doorNumber: number): Promise<SavedPhoto> {
  if (onlineStorageConfigured()) {
    const blob = await shrinkImage(file, 1280, MAX_ONLINE_BYTES);
    const ext = blob.type === "image/jpeg" ? "jpg" : "webp";
    const path = `${randomId(12)}/${doorNumber}.${ext}`;
    const { error } = await supabase().storage.from("door-photos").upload(path, blob, { contentType: blob.type, upsert: false });
    if (error) throw new Error("Couldn't upload that picture. Check your connection and try again.");
    return { ref: path, online: true };
  }
  const blob = await shrinkImage(file, 900, 130_000);
  const id = randomId(9);
  try {
    window.localStorage.setItem(localPhotoKey(id), await blobToDataUrl(blob));
  } catch {
    throw new Error("This device has no room left for more photos. Remove one and try again.");
  }
  return { ref: `local:${id}`, online: false };
}

/** Forgets a photo saved only on this device. Online photos are left in the bucket. */
export function forgetPhoto(ref: string) {
  if (!ref.startsWith("local:")) return;
  try {
    window.localStorage.removeItem(localPhotoKey(ref.slice(6)));
  } catch {
    /* nothing to do */
  }
}
