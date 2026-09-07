// Hallmark · component: stat-tile · design-system: design.md
import type { ReactNode } from "react";

export default function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <div className="rounded-card border border-rule bg-surface p-4">
      <p className="text-xs text-ink-3">{label}</p>
      <p className={`font-numeric text-lg font-semibold mt-1 ${tone === "accent" ? "text-accent" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
