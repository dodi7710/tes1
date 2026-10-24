// Hallmark · family: transactional-workbench · design-system: design.md
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cancelOrder } from "@/app/actions/orders";
import { markWaOrderPaid, markWaOrderPickedUp, unmarkWaOrderPaid } from "@/app/actions/pesanan";
import { formatRupiah, formatWaktu } from "@/lib/format";
import {
  buildWaMessage,
  formatWa,
  METODE_LABEL,
  waLink,
  waStatus,
  WA_STATUS_LABEL,
  WA_STATUS_TONE,
} from "@/lib/wa";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button, { buttonClasses } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import ConfirmDisclosure from "@/components/ui/confirm-disclosure";

type Metode = "qris" | "transfer" | "tunai";

type Order = {
  id: string;
  kode: string;
  status: string;
  noWa: string;
  namaPelanggan: string | null;
  waktuAmbil: string | null;
  catatan: string | null;
  dibukaPada: string;
  dibukaOleh: string | null;
  diubahPada: string | null;
  diubahOleh: string | null;
  diambilPada: string | null;
  diambilOleh: string | null;
  dibatalkanPada: string | null;
  dibatalkanOleh: string | null;
  alasanBatal: string | null;
  items: { id: string; nama_item: string; qty: number; harga_saat_itu: number }[];
  payment: { metode: string; dibuatPada: string; oleh: string | null } | null;
};

export default function WaOrderDetail({
  order,
  store,
  isPemilik,
}: {
  order: Order;
  store: { nama: string; alamatAmbil: string | null; infoPembayaran: string | null };
  isPemilik: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [metode, setMetode] = useState<Metode>("qris");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [unpayOpen, setUnpayOpen] = useState(false);

  const st = waStatus({ status: order.status, diambil_pada: order.diambilPada });
  const total = order.items.reduce((s, i) => s + i.qty * i.harga_saat_itu, 0);
  const message = buildWaMessage({
    kode: order.kode,
    dibukaPada: order.dibukaPada,
    namaPelanggan: order.namaPelanggan,
    waktuAmbil: order.waktuAmbil,
    items: order.items,
    namaToko: store.nama,
    alamatAmbil: store.alamatAmbil,
    infoPembayaran: store.infoPembayaran,
    metodeLunas: order.payment?.metode ?? null,
  });

  function run(fn: () => Promise<unknown>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        after?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal menyimpan");
      }
    });
  }

  return (
    <main className="flex-1 p-4 max-w-5xl w-full mx-auto space-y-4">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            Pesanan <span className="font-numeric">{order.kode}</span>
            <Badge tone={WA_STATUS_TONE[st]}>{WA_STATUS_LABEL[st]}</Badge>
          </span>
        }
        subtitle={`Dibuat ${formatWaktu(order.dibukaPada)}${order.dibukaOleh ? ` oleh ${order.dibukaOleh}` : ""}`}
        back={{ href: "/pesanan", label: "Pesanan WA" }}
      />

      <div className="flex flex-col md:flex-row gap-4 md:items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <Card className="p-4 space-y-1 text-sm">
            <h2 className="font-medium text-ink mb-2">Pelanggan</h2>
            <Row label="No. WA" value={formatWa(order.noWa)} numeric />
            {order.namaPelanggan && <Row label="Nama" value={order.namaPelanggan} />}
            {order.waktuAmbil && <Row label="Waktu ambil" value={order.waktuAmbil} />}
            {order.catatan && <Row label="Catatan" value={order.catatan} />}
          </Card>

          <Card as="ul" className="divide-y divide-rule-2">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-ink">
                  {i.nama_item} <span className="text-ink-3">x{i.qty}</span>
                </span>
                <span className="font-numeric text-ink-2">{formatRupiah(i.qty * i.harga_saat_itu)}</span>
              </li>
            ))}
          </Card>

          <Card className="p-4 space-y-1 text-xs text-ink-3">
            <h2 className="text-sm font-medium text-ink mb-1">Riwayat</h2>
            <p>Dibuat {formatWaktu(order.dibukaPada)}{order.dibukaOleh ? ` · ${order.dibukaOleh}` : ""}</p>
            {order.diubahPada && (
              <p>Diubah {formatWaktu(order.diubahPada)}{order.diubahOleh ? ` · ${order.diubahOleh}` : ""}</p>
            )}
            {order.payment && (
              <p>
                Dibayar {METODE_LABEL[order.payment.metode] ?? order.payment.metode} · {formatWaktu(order.payment.dibuatPada)}
                {order.payment.oleh ? ` · dicatat ${order.payment.oleh}` : ""}
              </p>
            )}
            {order.diambilPada && (
              <p>Diambil {formatWaktu(order.diambilPada)}{order.diambilOleh ? ` · ${order.diambilOleh}` : ""}</p>
            )}
            {order.dibatalkanPada && (
              <p className="text-danger">
                Dibatalkan {formatWaktu(order.dibatalkanPada)}
                {order.dibatalkanOleh ? ` · ${order.dibatalkanOleh}` : ""} — {order.alasanBatal}
              </p>
            )}
          </Card>
        </div>

        {/* Persistent rail — total and the next action for this order */}
        <aside className="md:w-80 shrink-0 space-y-3 md:sticky md:top-20 md:self-start">
          <div className="flex items-center justify-between rounded-card bg-ink text-paper px-4 py-3">
            <span className="text-sm font-medium">Total</span>
            <span className="font-numeric text-lg font-semibold">{formatRupiah(total)}</span>
          </div>

          {error && (
            <p className="rounded-input bg-danger-bg border border-danger/25 text-danger text-sm px-3 py-2">{error}</p>
          )}

          {st !== "batal" && (
            <a
              href={waLink(order.noWa, message)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ size: "lg", fullWidth: true, variant: st === "belum_bayar" ? "secondary" : "primary" })}
            >
              Kirim ke WA {formatWa(order.noWa)}
            </a>
          )}

          {st === "belum_bayar" && !payOpen && (
            <Button size="lg" fullWidth onClick={() => setPayOpen(true)}>
              ✓ Sudah dibayar
            </Button>
          )}

          {st === "belum_bayar" && payOpen && (
            <Card className="p-4 space-y-3">
              <fieldset>
                <legend className="text-sm font-medium text-ink mb-2">Dibayar lewat</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(["qris", "transfer", "tunai"] as const).map((m) => (
                    <label
                      key={m}
                      className={`min-h-12 flex items-center justify-center rounded-input border px-2 text-center text-sm font-medium cursor-pointer transition-colors duration-short ease-out has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus ${
                        metode === m ? "border-accent bg-accent-2 text-accent" : "border-rule text-ink-2 hover:bg-paper-2"
                      }`}
                    >
                      <input
                        type="radio"
                        name="metode"
                        value={m}
                        checked={metode === m}
                        onChange={() => setMetode(m)}
                        className="sr-only"
                      />
                      {m === "tunai" ? "COD" : METODE_LABEL[m]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="text-xs text-ink-3">
                {metode === "tunai"
                  ? "COD = tunai diterima saat ambil, masuk ke shift Anda yang sedang buka."
                  : "Pastikan dana sudah masuk di aplikasi bank/merchant sebelum dicentang."}
              </p>
              <div className="flex gap-2">
                <Button loading={isPending} onClick={() => run(() => markWaOrderPaid(order.id, metode), () => setPayOpen(false))}>
                  Tandai lunas {formatRupiah(total)}
                </Button>
                <Button variant="ghost" onClick={() => setPayOpen(false)}>
                  Batal
                </Button>
              </div>
            </Card>
          )}

          {st === "lunas" && (
            <Button size="lg" fullWidth variant="secondary" loading={isPending} onClick={() => run(() => markWaOrderPickedUp(order.id))}>
              Tandai sudah diambil
            </Button>
          )}

          {st === "belum_bayar" && (
            <Link href={`/pesanan/${order.id}/ubah`} className={buttonClasses({ variant: "ghost", fullWidth: true })}>
              Ubah pesanan
            </Link>
          )}

          {st === "belum_bayar" &&
            (cancelOpen ? (
              <ConfirmDisclosure
                prompt="Pesanan ini akan dibatalkan dan tidak masuk omzet."
                reasonPlaceholder="Alasan pembatalan"
                submitLabel="Batalkan pesanan"
                onCancel={() => setCancelOpen(false)}
                onSubmit={(alasan) => run(() => cancelOrder(order.id, alasan))}
              />
            ) : (
              <Button variant="destructive" fullWidth onClick={() => setCancelOpen(true)}>
                Batalkan pesanan
              </Button>
            ))}

          {st === "lunas" && isPemilik &&
            (unpayOpen ? (
              <Card className="p-4 space-y-3 bg-warning-bg border-warning/25">
                <p className="text-sm text-warning">Status kembali ke menunggu bayar dan pembayaran dihapus dari laporan.</p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    loading={isPending}
                    onClick={() => run(() => unmarkWaOrderPaid(order.id), () => setUnpayOpen(false))}
                  >
                    Batalkan pembayaran
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setUnpayOpen(false)}>
                    Batal
                  </Button>
                </div>
              </Card>
            ) : (
              <Button variant="ghost" size="sm" fullWidth onClick={() => setUnpayOpen(true)}>
                Salah centang? Batalkan pembayaran
              </Button>
            ))}
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value, numeric }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 text-ink-3">{label}</span>
      <span className={`text-ink ${numeric ? "font-numeric" : ""}`}>{value}</span>
    </div>
  );
}
