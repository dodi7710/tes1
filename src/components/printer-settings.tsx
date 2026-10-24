// Hallmark · family: crud-admin · design-system: design.md
"use client";

import { useState } from "react";
import { usePrinter } from "@/components/printer-provider";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Dot } from "@/components/ui/badge";

/**
 * The connection lives in PrinterProvider (app layout), so a printer paired
 * here stays connected while the kasir moves on to Meja or Order.
 */
export default function PrinterSettings() {
  const { status, deviceName, error, connect, disconnect } = usePrinter();
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    try {
      await connect();
    } finally {
      setConnecting(false);
    }
  }

  const connected = status === "tersambung";

  return (
    <Card className="p-4 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-48">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <Dot tone={connected ? "success" : status === "error" ? "danger" : "neutral"} />
          {connected ? (deviceName ?? "Printer tersambung") : status === "error" ? "Gagal tersambung" : "Belum tersambung"}
        </p>
        <p className="text-sm text-ink-2 mt-0.5">
          {connected
            ? "Struk akan dicetak ke printer ini."
            : (error ?? "Nyalakan printer Bluetooth, lalu sambungkan dari HP ini.")}
        </p>
      </div>
      {connected ? (
        <Button variant="secondary" onClick={disconnect}>
          Putuskan
        </Button>
      ) : (
        <Button onClick={handleConnect} loading={connecting}>
          {status === "error" ? "Coba lagi" : "Sambungkan printer"}
        </Button>
      )}
    </Card>
  );
}
