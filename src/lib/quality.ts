/** True on phones and weak machines: the scene then uses a smaller reflection and fewer particles. */
export function isLowEnd(): boolean {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return mobile || cores <= 4;
}
