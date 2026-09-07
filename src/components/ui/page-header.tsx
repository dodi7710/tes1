// Hallmark · component: page-header · design-system: design.md
import Link from "next/link";
import type { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { href: string; label?: string };
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-2 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {actions}
        {back && (
          <Link
            href={back.href}
            className="text-sm text-ink-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-input px-1"
          >
            &larr; {back.label ?? "Kembali"}
          </Link>
        )}
      </div>
    </div>
  );
}
