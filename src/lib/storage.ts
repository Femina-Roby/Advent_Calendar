import { localPhotoKey, parsePhotoRef } from "./photo";

/** True when the online photo bucket is configured (Supabase URL and key are set). */
export const onlineStorageConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Turns a photo reference into something an <img> or a texture can load, or null if it can't be shown here.
 * Local photos only exist on the device that added them; remote ones need the online bucket configured.
 */
export function photoUrl(ref: string | null | undefined): string | null {
  const p = parsePhotoRef(ref);
  if (!p) return null;
  if (p.kind === "static") return p.path;
  if (p.kind === "local") {
    try {
      return typeof window === "undefined" ? null : window.localStorage.getItem(localPhotoKey(p.id));
    } catch {
      return null;
    }
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/door-photos/${p.path.split("/").map(encodeURIComponent).join("/")}`;
}
