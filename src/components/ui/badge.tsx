// Hallmark · component: badge · design-system: design.md
import type { ReactNode } from "react";

type Tone = "success" | "danger" | "warning" | "neutral" | "accent";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  warning: "bg-warning-bg text-warning",
  neutral: "bg-paper-2 text-ink-2",
  accent: "bg-accent-2 text-accent",
};

const dotClasses: Record<Tone, string> = {
  success: "bg-success",
  danger: "bg-danger",
  warning: "bg-warning",
  neutral: "bg-ink-3",
  accent: "bg-accent",
};

export default function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** A bare status dot, e.g. for the printer-connection indicator. */
export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  return <span className={`h-2 w-2 rounded-full ${dotClasses[tone]}`} />;
}
