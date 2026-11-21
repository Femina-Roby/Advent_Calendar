"use client";

import { useEffect, useState } from "react";

/** Reveals text one character at a time. With reduced motion, or when disabled, the whole text is shown at once. */
export function useTypewriter(text: string, msPerChar = 18, enabled = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Start after a beat so it still reads as a screen, not a flash.
      const t = setTimeout(() => setCount(text.length), 400);
      return () => clearTimeout(t);
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) clearInterval(id);
    }, msPerChar);
    return () => clearInterval(id);
  }, [text, msPerChar, enabled]);

  return text.slice(0, count);
}
