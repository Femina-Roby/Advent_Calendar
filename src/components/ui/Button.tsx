import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "glass" | "quiet" | "letter";
type Size = "md" | "sm" | "icon";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background,box-shadow,border-color,color] duration-300 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  // Warm lantern gold, the one action that matters on a screen.
  primary:
    "rounded-full bg-[linear-gradient(180deg,var(--gold-bright),var(--gold))] text-[#2a1d08] shadow-[0_8px_24px_-8px_rgb(226_184_98/0.7),inset_0_1px_0_rgb(255_255_255/0.55)] hover:brightness-105",
  glass:
    "rounded-full border border-[var(--hairline-soft)] bg-white/[0.06] text-cream backdrop-blur-md hover:border-[var(--hairline)] hover:bg-white/[0.1]",
  quiet: "rounded-full text-dim hover:text-cream",
  // Buttons that sit on warm paper.
  letter:
    "rounded-full border border-[#22332a]/15 bg-[#22332a]/[0.05] text-paper-ink hover:bg-[#22332a]/[0.1]",
};

const sizes: Record<Size, string> = {
  md: "h-12 px-7 text-[0.95rem]",
  sm: "h-10 px-5 text-sm",
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
