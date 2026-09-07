// Hallmark · component: confirm-disclosure · design-system: design.md
// states: default · focus (input) · disabled (submit while empty) · active
//
// Void item / cancel order / cancel table / close-shift all keep a
// typed-reason confirm — money and already-printed kitchen tickets are at
// stake (design.md § Microinteractions stance). This restyles the
// disclosure; it never removes the reason requirement.
"use client";

import { useState, type ReactNode } from "react";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ConfirmDisclosure({
  prompt,
  reasonPlaceholder = "Alasan",
  submitLabel = "Konfirmasi",
  tone = "danger",
  compact = false,
  onCancel,
  onSubmit,
}: {
  prompt: ReactNode;
  reasonPlaceholder?: string;
  submitLabel?: string;
  tone?: "danger" | "warning";
  /** Compact renders as a single inline row (e.g. per-item void) instead of
   *  a boxed panel (e.g. cancel table / close shift). */
  compact?: boolean;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const submit = () => reason.trim() && onSubmit(reason);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1 min-w-[8rem] text-sm text-ink-2">{prompt}</span>
        <Input
          autoFocus
          required
          placeholder={reasonPlaceholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="flex-1 min-w-[10rem] min-h-10"
        />
        <Button variant="destructive" size="sm" onClick={submit}>
          {submitLabel}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Batal
        </Button>
      </div>
    );
  }

  const toneClasses = tone === "danger" ? "bg-danger-bg border-danger/25" : "bg-warning-bg border-warning/25";
  const textClasses = tone === "danger" ? "text-danger" : "text-warning";

  return (
    <div className={`rounded-card border p-4 space-y-3 ${toneClasses}`}>
      <p className={`text-sm ${textClasses}`}>{prompt}</p>
      <Input
        autoFocus
        required
        placeholder={reasonPlaceholder}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" onClick={submit}>
          {submitLabel}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </div>
  );
}
