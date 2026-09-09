// Hallmark · component: button (class builder) · design-system: design.md
// Pure className builder, deliberately NOT in a "use client" module — Server
// Components (e.g. app/(app)/meja/page.tsx) call this directly to style a
// plain <Link>. Keeping it out of button.tsx avoids that whole file's
// "use client" boundary making this plain string function uncallable from
// server code (a real bug this fixed: "Attempted to call buttonClasses()
// from the server but buttonClasses is on the client").

export type Variant = "primary" | "secondary" | "ghost" | "destructive";
export type Size = "sm" | "md" | "lg";

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
