// Hallmark · family: transactional-workbench · design-system: design.md
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPayment } from "@/app/actions/orders";
import { usePrinter } from "@/components/printer-provider";
import { buildPaymentReceipt } from "@/lib/print/templates";
import { formatRupiah, parseRupiah } from "@/lib/format";
import RupiahKeypadInput from "@/components/rupiah-keypad-input";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";

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
    <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4">
      <PageHeader title={`Bayar — Meja ${table.nomor}`} back={{ href: `/meja/${table.id}` }} />

      {error && (
        <p className="rounded-input bg-danger-bg border border-danger/25 text-danger text-sm px-3 py-2">{error}</p>
      )}

      <form onSubmit={submit} className="flex flex-col lg:flex-row gap-4">
        {/* Scrolling zone — items, discount, method, amount entry */}
        <div className="flex-1 min-w-0 space-y-3">
          <Card className="divide-y divide-rule-2">
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className="flex-1">
                  {i.qty}x {i.nama_item}
                </span>
                <span className="font-numeric text-ink-2">{formatRupiah(i.qty * i.harga_saat_itu)}</span>
              </div>
            ))}
          </Card>

          <div>
            <span className="text-xs font-medium text-ink-2">Diskon (Rp atau kosongkan)</span>
            <div className="mt-1">
              <RupiahKeypadInput value={diskonInput} onChange={setDiskonInput} placeholder="Rp 0" />
            </div>
          </div>

          <div className="flex gap-2">
            {(["tunai", "qris"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetode(m)}
                className={`flex-1 min-h-12 rounded-input border text-sm font-medium transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                  metode === m ? "border-accent bg-accent-2 text-accent" : "border-rule text-ink-2"
                }`}
              >
                {m === "tunai" ? "Tunai" : "QRIS"}
              </button>
            ))}
          </div>

          {metode === "tunai" && (
            <div>
              <span className="text-xs font-medium text-ink-2">Uang diterima</span>
              <div className="mt-1">
                <RupiahKeypadInput value={bayarInput} onChange={setBayarInput} placeholder="Uang diterima (Rp)" autoOpen />
              </div>
            </div>
          )}
        </div>

        {/* Persistent rail — totals + submit */}
        <aside className="lg:w-72 shrink-0 space-y-3 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-3 text-sm space-y-1">
            <div className="flex justify-between text-ink-2">
              <span>Subtotal</span>
              <span className="font-numeric">{formatRupiah(subtotal)}</span>
            </div>
            {diskon > 0 && (
              <div className="flex justify-between text-ink-2">
                <span>Diskon</span>
                <span className="font-numeric">-{formatRupiah(diskon)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-ink text-base">
              <span>Total</span>
              <span className="font-numeric">{formatRupiah(total)}</span>
            </div>
            {metode === "tunai" && bayarInput && (
              <div className="flex justify-between text-success font-medium">
                <span>Kembalian</span>
                <span className="font-numeric">{formatRupiah(kembalian)}</span>
              </div>
            )}
          </Card>

          {!printer.deviceName && (
            <p className="text-xs text-ink-3">
              Printer belum tersambung — sambungkan dari pojok kanan atas sebelum bayar agar struk otomatis cetak.
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isPending}
            disabled={metode === "tunai" && bayar < total}
          >
            Selesaikan Pembayaran
          </Button>
        </aside>
      </form>
    </main>
  );
}
