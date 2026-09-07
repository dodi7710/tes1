// Hallmark · component: numeric-keypad · design-system: design.md
// states: default · hover · focus · active · disabled
//
// Presentational extraction only. Callers (login PIN entry, Rupiah amount
// entry) keep their own value formatting and commit logic untouched — this
// component owns layout/styling only, preserving the deliberate
// no-native-<input> behavior both callers depend on.
"use client";

import type { ReactNode } from "react";

type KeySlot = {
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "default";
};

export default function NumericKeypad({
  onDigit,
  onBackspace,
  disabled = false,
  slot10,
  backspaceLabel = "Hapus",
  footer,
  dense = false,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
  /** Bottom-left grid slot — e.g. a submit ("Masuk") or clear
   *  ("Kosongkan") action. Left blank when omitted. */
  slot10?: KeySlot;
  backspaceLabel?: string;
  /** Optional full-width row below the grid, e.g. a "Selesai" done button. */
  footer?: ReactNode;
  dense?: boolean;
}) {
  const h = dense ? "h-12" : "h-16";
  const keyBase = `${h} rounded-input font-medium transition-colors duration-fast ease-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus`;
  const digitClasses = `${keyBase} ${dense ? "text-lg" : "text-xl"} bg-surface border border-rule text-ink active:bg-accent-2`;
  const backspaceClasses = `${keyBase} ${dense ? "text-xs" : "text-sm"} bg-surface border border-rule text-ink-2 active:bg-accent-2`;
  const slotClasses =
    slot10?.tone === "primary"
      ? `${keyBase} text-sm bg-accent text-accent-ink active:brightness-95`
      : `${keyBase} ${dense ? "text-xs" : "text-sm"} bg-surface border border-rule text-ink-2 active:bg-accent-2`;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => onDigit(d)}
            className={digitClasses}
          >
            {d}
          </button>
        ))}
        {slot10 ? (
          <button
            type="button"
            disabled={disabled || slot10.disabled}
            onClick={slot10.onClick}
            className={slotClasses}
          >
            {slot10.label}
          </button>
        ) : (
          <div aria-hidden />
        )}
        <button type="button" disabled={disabled} onClick={() => onDigit("0")} className={digitClasses}>
          0
        </button>
        <button type="button" disabled={disabled} onClick={onBackspace} className={backspaceClasses}>
          {backspaceLabel}
        </button>
      </div>
      {footer}
    </div>
  );
}
