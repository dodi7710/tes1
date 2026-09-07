// Hallmark · component: table · design-system: design.md
import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function TableWrap({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-card border border-rule bg-surface overflow-x-auto ${className}`} {...props} />
  );
}

export function Table({ className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={`w-full text-sm ${className}`} {...props} />;
}

export function Thead({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />;
}

export function Th({ className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-ink-3 border-b border-rule-2 ${className}`}
      {...props}
    />
  );
}

export function Tr({ className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`border-b border-rule-2 last:border-0 ${className}`} {...props} />;
}

export function Td({
  className = "",
  align,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" }) {
  return <td className={`px-4 py-2 ${align === "right" ? "text-right" : ""} ${className}`} {...props} />;
}
