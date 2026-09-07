// Hallmark · component: button · design-system: design.md
// states: default · hover · focus · active · disabled · loading
"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-input font-medium transition duration-short ease-out active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
  const sizes: Record<Size, string> = {
    sm: "min-h-10 px-3 text-sm",
    md: "min-h-12 px-4 text-sm",
    lg: "min-h-12 px-6 text-base",
  };
  const variants: Record<Variant, string> = {
    primary: "bg-accent text-accent-ink hover:brightness-105 active:brightness-95",
    secondary: "border border-rule bg-surface text-ink hover:bg-paper-2",
    ghost: "text-ink-2 hover:bg-paper-2",
    destructive: "border border-danger/30 text-danger hover:bg-danger-bg",
  };
  return [base, sizes[size], variants[variant], fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

export default Button;

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
