// A photo on a door is referred to by a short string. Only three shapes are ever accepted, so a link
// that someone has tampered with can never make the page load an arbitrary address.
//   local:<id>                  a photo saved on this device only
//   <random>/<name>.webp        a photo in the online `door-photos` bucket
//   /premade/<file>             a picture bundled with the site (the premade calendar)
export type PhotoRef =
  | { kind: "local"; id: string }
  | { kind: "remote"; path: string }
  | { kind: "static"; path: string };

const LOCAL = /^local:([A-Za-z0-9_-]{6,40})$/;
const REMOTE = /^[A-Za-z0-9_-]{6,40}\/[A-Za-z0-9_-]{1,40}\.(?:webp|jpg|jpeg|png)$/;
const STATIC = /^\/premade\/[A-Za-z0-9_.-]{1,60}$/;

export function parsePhotoRef(ref: string | null | undefined): PhotoRef | null {
  if (!ref) return null;
  const local = LOCAL.exec(ref);
  if (local) return { kind: "local", id: local[1] };
  if (REMOTE.test(ref)) return { kind: "remote", path: ref };
  if (STATIC.test(ref) && !ref.includes("..")) return { kind: "static", path: ref };
  return null;
}

/** The reference if it is an accepted shape, otherwise an empty string. */
export function cleanPhotoRef(ref: string | null | undefined): string {
  return parsePhotoRef(ref) ? (ref as string) : "";
}

export const localPhotoKey = (id: string) => `adv-photo:${id}`;
