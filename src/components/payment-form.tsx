"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPayment } from "@/app/actions/orders";
import { usePrinter } from "@/components/printer-provider";
import { buildPaymentReceipt } from "@/lib/print/templates";
import { formatRupiah, parseRupiah } from "@/lib/format";

type Item = { id: string; nama_item: string; harga_saat_itu: number; qty: number };

export default function PaymentForm({
  table,
  orderId,
  items,
  storeName,
  storeAddress,
  kasirName,
}: {
  table: { id: string; nomor: number };
  orderId: string;
  items: Item[];
  storeName: string;
  storeAddress: string | null;
  kasirName: string;
}) {
  const [metode, setMetode] = useState<"tunai" | "qris">("tunai");
  const [diskonInput, setDiskonInput] = useState("");
  const [bayarInput, setBayarInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const printer = usePrinter();
  const router = useRouter();

  const subtotal = items.reduce((s, i) => s + i.qty * i.harga_saat_itu, 0);
  const diskon = Math.min(Math.max(parseRupiah(diskonInput), 0), subtotal);
  const total = subtotal - diskon;
  const bayar = parseRupiah(bayarInput);
  const kembalian = useMemo(() => (metode === "tunai" ? Math.max(bayar - total, 0) : 0), [metode, bayar, total]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      let result;
      try {
        result = await createPayment({
          orderId,
          metode,
          diskon,
          jumlahDibayar: metode === "tunai" ? bayar : null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memproses pembayaran");
        return;
      }

      // Payment is safely recorded at this point regardless of what happens
      // below. Printing (and Next re-validating this page right after the
      // action above) can race with component state, so we surface a print
      // failure via a blocking alert() rather than in-page state, and always
      // navigate back to the floor once the transaction itself is done.
      const bytes = buildPaymentReceipt({
        namaWarung: storeName,
        alamat: storeAddress,
        nomorMeja: table.nomor,
        namaKasir: kasirName,
        items,
        subtotal: result.subtotal,
        diskon: result.diskon,
        total: result.total,
        metode,
        jumlahDibayar: result.jumlahDibayar,
        kembalian: result.kembalian,
        waktu: new Date().toISOString(),
      });
      const printResult = await printer.print(bytes);
      if (!printResult.ok) {
        alert(
          `Pembayaran tersimpan. Struk gagal dicetak: ${printResult.error}\n\nCek sambungan printer lalu cetak ulang manual bila perlu.`,
        );
      }
      router.replace("/meja");
    });
  }

  return (
    <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-800">Bayar — Meja {table.nomor}</h1>
        <Link href={`/meja/${table.id}`} className="text-sm text-stone-500">
          &larr; Kembali
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</p>
      )}

      <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 px-4 py-2 text-sm">
            <span className="flex-1">{i.qty}x {i.nama_item}</span>
            <span className="tabular-nums text-stone-600">{formatRupiah(i.qty * i.harga_saat_itu)}</span>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-stone-500">Diskon (Rp atau kosongkan)</span>
          <input
            inputMode="numeric"
            value={diskonInput}
            onChange={(e) => setDiskonInput(e.target.value)}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="flex gap-2">
          {(["tunai", "qris"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetode(m)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                metode === m ? "border-amber-600 bg-amber-50 text-amber-800" : "border-stone-200 text-stone-600"
              }`}
            >
              {m === "tunai" ? "Tunai" : "QRIS"}
            </button>
          ))}
        </div>

        {metode === "tunai" && (
          <label className="block">
            <span className="text-xs font-medium text-stone-500">Uang diterima</span>
            <input
              required
              inputMode="numeric"
              value={bayarInput}
              onChange={(e) => setBayarInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
        )}

        <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-sm space-y-1">
          <div className="flex justify-between text-stone-500">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatRupiah(subtotal)}</span>
          </div>
          {diskon > 0 && (
            <div className="flex justify-between text-stone-500">
              <span>Diskon</span>
              <span className="tabular-nums">-{formatRupiah(diskon)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-stone-800 text-base">
            <span>Total</span>
            <span className="tabular-nums">{formatRupiah(total)}</span>
          </div>
          {metode === "tunai" && bayarInput && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Kembalian</span>
              <span className="tabular-nums">{formatRupiah(kembalian)}</span>
            </div>
          )}
        </div>

        {!printer.deviceName && (
          <p className="text-xs text-stone-400">
            Printer belum tersambung — sambungkan dari pojok kanan atas sebelum bayar agar struk otomatis cetak.
          </p>
        )}

        <button
          disabled={isPending || (metode === "tunai" && bayar < total)}
          className="w-full rounded-xl bg-amber-700 text-white py-3 text-sm font-semibold disabled:opacity-50"
        >
          Selesaikan Pembayaran
        </button>
      </form>
    </main>
  );
}
