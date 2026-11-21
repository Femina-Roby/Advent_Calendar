import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "glass" | "quiet" | "letter";
type Size = "md" | "sm" | "icon";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap font-medium transition-[background,border-color,color,transform] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  // The one action that matters on a screen: flat lantern gold, nothing glossy.
  primary: "rounded-[10px] bg-gold font-semibold text-[#1d1506] hover:bg-gold-bright",
  // Outlined, for the second choice.
  glass: "rounded-[10px] border border-cream/30 text-cream hover:border-gold hover:text-gold-bright",
  quiet: "rounded-[10px] text-dim hover:bg-white/[0.06] hover:text-cream",
  // Buttons that sit on warm paper.
  letter: "rounded-[10px] border border-[#22332a]/30 text-paper-ink hover:border-[#22332a]/60 hover:bg-[#22332a]/[0.05]",
};

const sizes: Record<Size, string> = {
  md: "h-12 px-6 text-[0.95rem] tracking-[0.005em]",
  sm: "h-10 px-4 text-sm",
  icon: "size-11",
};

/** Class names for a button, so links can look exactly like buttons. */
export const btn = (variant: Variant = "primary", size: Size = "md", extra = "") =>
  `${base} ${variants[variant]} ${sizes[size]} ${extra}`;

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <button className={btn(variant, size, className)} {...props}>
      {icon}
      {children}
    </button>
  );
}
