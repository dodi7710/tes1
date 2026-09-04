"use client";

import { useState, useTransition } from "react";
import { closeShift, openShift } from "@/app/actions/shifts";
import { formatRupiah, formatWaktu, parseRupiah } from "@/lib/format";
import RupiahKeypadInput from "@/components/rupiah-keypad-input";

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
      <form onSubmit={submit} className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
        <p className="text-sm text-amber-900">Belum ada shift terbuka. Masukkan modal kas awal untuk mulai.</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          <div className="flex-1">
            <RupiahKeypadInput value={modalAwal} onChange={setModalAwal} placeholder="Modal awal (Rp)" autoOpen />
          </div>
          <button
            disabled={isPending || !modalAwal}
            className="rounded-lg bg-amber-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 whitespace-nowrap"
          >
            Buka Shift
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    );
  }

  if (result) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
        <h3 className="font-medium text-stone-800">Shift ditutup</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-stone-500">Total tunai tercatat</span>
            <span className="tabular-nums">{formatRupiah(result.totalTunai)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Seharusnya di laci</span>
            <span className="tabular-nums">{formatRupiah(result.expected)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Selisih</span>
            <span className={`tabular-nums ${result.selisih === 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatRupiah(result.selisih)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-900">Shift sedang berjalan</p>
          <p className="text-xs text-emerald-700">Dibuka {formatWaktu(shift.waktuBuka)}</p>
        </div>
        <span className="rounded-full bg-emerald-600 text-white text-xs font-medium px-2.5 py-1">Buka</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-white p-3">
          <p className="text-xs text-stone-400">Modal awal</p>
          <p className="font-medium tabular-nums">{formatRupiah(shift.modalAwal)}</p>
        </div>
        <div className="rounded-lg bg-white p-3">
          <p className="text-xs text-stone-400">Tunai masuk (tercatat)</p>
          <p className="font-medium tabular-nums">{formatRupiah(shift.runningCash)}</p>
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
        className="space-y-2 border-t border-emerald-200 pt-3"
      >
        <p className="text-xs font-medium text-emerald-900">Tutup shift — hitung uang fisik di laci</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          <div className="flex-1">
            <RupiahKeypadInput value={kasFisik} onChange={setKasFisik} placeholder="Uang fisik di laci (Rp)" />
          </div>
          <button
            disabled={isPending || !kasFisik}
            className="rounded-lg bg-stone-800 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 whitespace-nowrap"
          >
            Tutup Shift
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
