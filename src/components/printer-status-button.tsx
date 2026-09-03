"use client";

import { usePrinter } from "@/components/printer-provider";

export default function PrinterStatusButton() {
  const { status, deviceName, error, connect, disconnect } = usePrinter();

  const dotColor =
    status === "tersambung" ? "bg-emerald-500" : status === "error" ? "bg-red-500" : "bg-stone-300";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={status === "tersambung" ? disconnect : connect}
        title={error ?? undefined}
        className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50"
      >
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        {status === "tersambung" ? deviceName ?? "Printer" : status === "error" ? "Coba lagi" : "Sambungkan printer"}
      </button>
    </div>
  );
}
