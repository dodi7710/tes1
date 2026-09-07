// Hallmark · family: shell · design-system: design.md
"use client";

import { usePrinter } from "@/components/printer-provider";
import { Dot } from "@/components/ui/badge";

export default function PrinterStatusButton() {
  const { status, deviceName, error, connect, disconnect } = usePrinter();

  const tone = status === "tersambung" ? "success" : status === "error" ? "danger" : "neutral";

  return (
    <button
      onClick={status === "tersambung" ? disconnect : connect}
      title={error ?? undefined}
      className="flex items-center gap-1.5 min-h-10 rounded-input border border-rule px-2.5 text-xs font-medium text-ink-2 hover:bg-paper-2 transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <Dot tone={tone} />
      <span className="hidden sm:inline">
        {status === "tersambung" ? (deviceName ?? "Printer") : status === "error" ? "Coba lagi" : "Sambungkan printer"}
      </span>
      <span className="sm:hidden">
        {status === "tersambung" ? "Printer" : status === "error" ? "Error" : "Printer"}
      </span>
    </button>
  );
}
