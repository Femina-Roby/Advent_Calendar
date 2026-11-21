import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-base font-medium transition-[transform,background,box-shadow] duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-green text-paper shadow-[inset_0_0_0_1px_var(--gold)] hover:bg-green-deep",
  ghost: "bg-paper-2 text-ink hover:bg-paper-3",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
