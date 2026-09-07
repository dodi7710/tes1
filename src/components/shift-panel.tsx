// Hallmark · family: crud-admin · design-system: design.md
"use client";

import { useState, useTransition } from "react";
import { closeShift, openShift } from "@/app/actions/shifts";
import { formatRupiah, formatWaktu, parseRupiah } from "@/lib/format";
import RupiahKeypadInput from "@/components/rupiah-keypad-input";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";

type OpenShift = { id: string; modalAwal: number; waktuBuka: string; runningCash: number };

export default function ShiftPanel({ openShift: shift }: { openShift: OpenShift | null }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [modalAwal, setModalAwal] = useState("");
  const [kasFisik, setKasFisik] = useState("");
  const [result, setResult] = useState<{ totalTunai: number; expected: number; selisih: number } | null>(null);

  if (!shift) {
    function submit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);
      startTransition(async () => {
        try {
          await openShift(parseRupiah(modalAwal));
          // Clear any leftover close-shift summary from a previous shift —
          // otherwise it flashes back once this new shift is also closed,
          // since `result` isn't reset just by a new shift opening.
          setResult(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Gagal membuka shift");
        }
      });
    }

    return (
      <Card as="form" onSubmit={submit} className="bg-warning-bg border-warning/25 p-4 space-y-3">
        <p className="text-sm text-warning">Belum ada shift terbuka. Masukkan modal kas awal untuk mulai.</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          <div className="flex-1">
            <RupiahKeypadInput value={modalAwal} onChange={setModalAwal} placeholder="Modal awal (Rp)" autoOpen />
          </div>
          <Button type="submit" loading={isPending} disabled={!modalAwal} className="whitespace-nowrap">
            Buka Shift
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </Card>
    );
  }

  if (result) {
    return (
      <Card className="p-4 space-y-2">
        <h3 className="font-medium text-ink">Shift ditutup</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-ink-2">Total tunai tercatat</span>
            <span className="font-numeric">{formatRupiah(result.totalTunai)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-2">Seharusnya di laci</span>
            <span className="font-numeric">{formatRupiah(result.expected)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Selisih</span>
            <span className={`font-numeric ${result.selisih === 0 ? "text-success" : "text-danger"}`}>
              {formatRupiah(result.selisih)}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-success-bg border-success/25 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-success">Shift sedang berjalan</p>
          <p className="text-xs text-success/80">Dibuka {formatWaktu(shift.waktuBuka)}</p>
        </div>
        <Badge tone="success">Buka</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-input bg-surface p-3">
          <p className="text-xs text-ink-3">Modal awal</p>
          <p className="font-numeric font-medium">{formatRupiah(shift.modalAwal)}</p>
        </div>
        <div className="rounded-input bg-surface p-3">
          <p className="text-xs text-ink-3">Tunai masuk (tercatat)</p>
          <p className="font-numeric font-medium">{formatRupiah(shift.runningCash)}</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            try {
              const r = await closeShift(shift.id, parseRupiah(kasFisik));
              setResult(r);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Gagal menutup shift");
            }
          });
        }}
        className="space-y-2 border-t border-success/25 pt-3"
      >
        <p className="text-xs font-medium text-success">Tutup shift — hitung uang fisik di laci</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          <div className="flex-1">
            <RupiahKeypadInput value={kasFisik} onChange={setKasFisik} placeholder="Uang fisik di laci (Rp)" />
          </div>
          <Button type="submit" variant="secondary" loading={isPending} disabled={!kasFisik} className="whitespace-nowrap">
            Tutup Shift
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </form>
    </Card>
  );
}
