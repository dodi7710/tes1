"use client";

import { createContext, useCallback, useContext, useState } from "react";
import * as bt from "@/lib/print/bluetooth";

type PrinterStatus = "belum-tersambung" | "tersambung" | "error";

type PrinterContextValue = {
  status: PrinterStatus;
  deviceName: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  print: (bytes: Uint8Array) => Promise<{ ok: boolean; error?: string }>;
};

const PrinterContext = createContext<PrinterContextValue | null>(null);

export function PrinterProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<PrinterStatus>("belum-tersambung");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setError(null);
    try {
      await bt.connect();
      setStatus("tersambung");
      setDeviceName(bt.currentDeviceName());
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Gagal menyambungkan printer");
    }
  }, []);

  const disconnect = useCallback(() => {
    bt.disconnect();
    setStatus("belum-tersambung");
    setDeviceName(null);
  }, []);

  const print = useCallback(async (bytes: Uint8Array) => {
    if (!bt.isConnected()) {
      setStatus("error");
      setError("Printer belum tersambung.");
      return { ok: false, error: "Printer belum tersambung." };
    }
    try {
      await bt.printBytes(bytes);
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Gagal mencetak";
      setStatus("error");
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  return (
    <PrinterContext.Provider value={{ status, deviceName, error, connect, disconnect, print }}>
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const ctx = useContext(PrinterContext);
  if (!ctx) throw new Error("usePrinter dipanggil di luar PrinterProvider");
  return ctx;
}
