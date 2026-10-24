// Hallmark · family: data-reports · design-system: design.md
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatTanggal, formatWaktu } from "@/lib/format";
import PageHeader from "@/components/ui/page-header";
import StatTile from "@/components/ui/stat-tile";
import Card from "@/components/ui/card";
import { TableWrap, Table, Th, Tr, Td } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";

type Periode = "hari" | "minggu" | "bulan";

function rangeFor(periode: Periode): { start: Date; end: Date; label: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (periode === "minggu") {
    const day = start.getDay(); // 0 = Sunday
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diffToMonday);
  } else if (periode === "bulan") {
    start.setDate(1);
  }

  const label =
    periode === "hari" ? "Hari ini" : periode === "minggu" ? "Minggu ini" : "Bulan ini";
  return { start, end, label };
}

/** Validates a "YYYY-MM-DD" string from a <input type="date">. */
function parseDateParam(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function customRange(dariParam: string, sampaiParam: string): { start: Date; end: Date; label: string } | null {
  const start = parseDateParam(dariParam);
  const sampaiDay = parseDateParam(sampaiParam);
  if (!start || !sampaiDay || sampaiDay < start) return null;
  const end = new Date(sampaiDay);
  end.setHours(23, 59, 59, 999);
  const label = `${formatTanggal(start.toISOString())} – ${formatTanggal(end.toISOString())}`;
  return { start, end, label };
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string; dari?: string; sampai?: string }>;
}) {
  const { periode: periodeParam, dari, sampai } = await searchParams;
  const custom = dari && sampai ? customRange(dari, sampai) : null;
  const periode: Periode = periodeParam === "minggu" || periodeParam === "bulan" ? periodeParam : "hari";
  const { start, end, label } = custom ?? rangeFor(periode);

  const supabase = await createClient();

  const [{ data: payments }, { data: paidOrders }, { data: voids }, { data: cancelledOrders }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, metode, total, dibuat_pada, kasir_id, profiles(display_name), orders(jenis)")
      .gte("dibuat_pada", start.toISOString())
      .lte("dibuat_pada", end.toISOString())
      .order("dibuat_pada", { ascending: false }),
    supabase
      .from("orders")
      .select("id, meja_id, ditutup_pada, tables(nomor), order_items(nama_item, qty, status)")
      .eq("status", "lunas")
      .gte("ditutup_pada", start.toISOString())
      .lte("ditutup_pada", end.toISOString()),
    supabase
      .from("order_items")
      .select("id, nama_item, qty, alasan_batal, dibatalkan_pada, dibatalkan_oleh, profiles(display_name)")
      .eq("status", "dibatalkan")
      .gte("dibatalkan_pada", start.toISOString())
      .lte("dibatalkan_pada", end.toISOString())
      .order("dibatalkan_pada", { ascending: false }),
    supabase
      .from("orders")
      .select("id, kode, alasan_batal, dibatalkan_pada, tables(nomor), profiles!orders_dibatalkan_oleh_fkey(display_name)")
      .eq("status", "dibatalkan")
      .gte("dibatalkan_pada", start.toISOString())
      .lte("dibatalkan_pada", end.toISOString())
      .order("dibatalkan_pada", { ascending: false }),
  ]);

  const paymentRows = (payments ?? []) as unknown as {
    id: string;
    metode: string;
    total: number;
    dibuat_pada: string;
    kasir_id: string;
    profiles: { display_name: string } | null;
    orders: { jenis: string } | null;
  }[];

  const omzetTotal = paymentRows.reduce((s, p) => s + Number(p.total), 0);
  const tunaiTotal = paymentRows.filter((p) => p.metode === "tunai").reduce((s, p) => s + Number(p.total), 0);
  const qrisTotal = paymentRows.filter((p) => p.metode === "qris").reduce((s, p) => s + Number(p.total), 0);
  const transferTotal = paymentRows.filter((p) => p.metode === "transfer").reduce((s, p) => s + Number(p.total), 0);

  // LAP-7: dine-in vs pesanan WA.
  const perKanal = { dine_in: { jumlah: 0, total: 0 }, wa: { jumlah: 0, total: 0 } };
  for (const p of paymentRows) {
    const k = p.orders?.jenis === "wa" ? "wa" : "dine_in";
    perKanal[k].jumlah += 1;
    perKanal[k].total += Number(p.total);
  }

  const { count: waPerluDiproses } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("jenis", "wa")
    .or("status.eq.terbuka,and(status.eq.lunas,diambil_pada.is.null)");

  const perKasir = new Map<string, { nama: string; total: number; jumlah: number }>();
  for (const p of paymentRows) {
    const key = p.kasir_id;
    const existing = perKasir.get(key) ?? { nama: p.profiles?.display_name ?? "-", total: 0, jumlah: 0 };
    existing.total += Number(p.total);
    existing.jumlah += 1;
    perKasir.set(key, existing);
  }

  type PaidOrder = {
    id: string;
    meja_id: string;
    ditutup_pada: string;
    tables: { nomor: number } | null;
    order_items: { nama_item: string; qty: number; status: string }[];
  };
  const orderRows = (paidOrders ?? []) as unknown as PaidOrder[];

  const bestSellers = new Map<string, number>();
  for (const o of orderRows) {
    for (const it of o.order_items) {
      if (it.status !== "aktif") continue;
      bestSellers.set(it.nama_item, (bestSellers.get(it.nama_item) ?? 0) + it.qty);
    }
  }
  const bestSellersSorted = [...bestSellers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Per-meja omzet needs item price, which order_items carries but orders alone doesn't —
  // fetch active items for this period's paid orders joined back to their table number.
  const perMeja = new Map<number, { jumlahTransaksi: number; omzet: number }>();
  const { data: orderItemsWithPrice } = await supabase
    .from("order_items")
    .select("qty, harga_saat_itu, status, order_id, orders!inner(id, meja_id, status, ditutup_pada, tables(nomor))")
    .eq("status", "aktif")
    .eq("orders.status", "lunas")
    .gte("orders.ditutup_pada", start.toISOString())
    .lte("orders.ditutup_pada", end.toISOString());

  type ItemWithOrder = {
    qty: number;
    harga_saat_itu: number;
    order_id: string;
    orders: { meja_id: string; tables: { nomor: number } | null } | null;
  };
  for (const raw of (orderItemsWithPrice ?? []) as unknown as ItemWithOrder[]) {
    if (!raw.orders?.tables) continue; // pesanan WA has no table
    const nomor = raw.orders.tables.nomor;
    const entry = perMeja.get(nomor) ?? { jumlahTransaksi: 0, omzet: 0 };
    entry.omzet += raw.qty * Number(raw.harga_saat_itu);
    perMeja.set(nomor, entry);
  }
  for (const o of orderRows) {
    if (!o.tables) continue;
    const nomor = o.tables.nomor;
    const entry = perMeja.get(nomor) ?? { jumlahTransaksi: 0, omzet: 0 };
    entry.jumlahTransaksi += 1;
    perMeja.set(nomor, entry);
  }
  const perMejaSorted = [...perMeja.entries()].sort((a, b) => a[0] - b[0]);

  const voidRows = (voids ?? []) as unknown as {
    id: string;
    nama_item: string;
    qty: number;
    alasan_batal: string | null;
    dibatalkan_pada: string;
    profiles: { display_name: string } | null;
  }[];

  const cancelledOrderRows = (cancelledOrders ?? []) as unknown as {
    id: string;
    kode: string | null;
    alasan_batal: string | null;
    dibatalkan_pada: string;
    tables: { nomor: number } | null;
    profiles: { display_name: string } | null;
  }[];

  return (
    <main className="flex-1 p-4 max-w-3xl w-full mx-auto space-y-8">
      <div className="space-y-2">
        <PageHeader title="Laporan" />
        <div className="flex flex-wrap items-center gap-2">
          {(["hari", "minggu", "bulan"] as const).map((p) => (
            <Link
              key={p}
              href={`/laporan?periode=${p}`}
              className={`min-h-10 flex items-center rounded-input px-3 text-sm font-medium transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                !custom && periode === p ? "bg-accent-2 text-accent" : "text-ink-2 hover:bg-paper-2"
              }`}
            >
              {p === "hari" ? "Hari ini" : p === "minggu" ? "Minggu ini" : "Bulan ini"}
            </Link>
          ))}

          <form
            action="/laporan"
            className="flex flex-wrap items-center gap-1.5 sm:pl-2 sm:ml-1 sm:border-l sm:border-rule"
          >
            <Input type="date" name="dari" defaultValue={dari ?? ""} required className="min-h-10 w-36" />
            <span className="text-ink-3 text-sm">–</span>
            <Input type="date" name="sampai" defaultValue={sampai ?? ""} required className="min-h-10 w-36" />
            <Button type="submit" variant={custom ? "primary" : "secondary"} size="sm">
              Terapkan
            </Button>
          </form>
        </div>
        {dari && sampai && !custom && (
          <p className="text-xs text-danger">
            Rentang tanggal tidak valid — pastikan tanggal akhir tidak sebelum tanggal awal.
          </p>
        )}
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label={`Omzet — ${label}`} value={formatRupiah(omzetTotal)} tone="accent" />
        <StatTile label="Tunai / COD" value={formatRupiah(tunaiTotal)} />
        <StatTile label="QRIS" value={formatRupiah(qrisTotal)} />
        <StatTile label="Transfer" value={formatRupiah(transferTotal)} />
      </section>

      <section>
        <h2 className="font-medium text-ink mb-3">Per kanal</h2>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Kanal</Th>
                <Th className="text-right">Transaksi</Th>
                <Th className="text-right">Omzet</Th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Dine-in (meja)", perKanal.dine_in],
                  ["Pesanan WA", perKanal.wa],
                ] as const
              ).map(([nama, v]) => (
                <Tr key={nama}>
                  <Td>{nama}</Td>
                  <Td align="right" className="font-numeric">
                    {v.jumlah}
                  </Td>
                  <Td align="right" className="font-numeric">
                    {formatRupiah(v.total)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        {(waPerluDiproses ?? 0) > 0 && (
          <p className="mt-2 text-sm text-ink-2">
            {waPerluDiproses} pesanan WA belum lunas atau belum diambil.{" "}
            <Link href="/pesanan" className="font-medium text-accent hover:underline">
              Lihat pesanan
            </Link>
          </p>
        )}
      </section>

      <section>
        <h2 className="font-medium text-ink mb-3">Produk terlaris</h2>
        <Card className="divide-y divide-rule-2">
          {bestSellersSorted.map(([nama, qty]) => (
            <div key={nama} className="flex justify-between px-4 py-2 text-sm">
              <span>{nama}</span>
              <span className="font-numeric font-medium">{qty}x</span>
            </div>
          ))}
          {bestSellersSorted.length === 0 && (
            <p className="px-4 py-4 text-sm text-ink-3">Belum ada penjualan pada periode ini.</p>
          )}
        </Card>
      </section>

      <section>
        <h2 className="font-medium text-ink mb-3">Omzet per meja</h2>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Meja</Th>
                <Th className="text-right">Transaksi</Th>
                <Th className="text-right">Omzet</Th>
              </tr>
            </thead>
            <tbody>
              {perMejaSorted.map(([nomor, v]) => (
                <Tr key={nomor}>
                  <Td>Meja {nomor}</Td>
                  <Td align="right" className="font-numeric">
                    {v.jumlahTransaksi}
                  </Td>
                  <Td align="right" className="font-numeric">
                    {formatRupiah(v.omzet)}
                  </Td>
                </Tr>
              ))}
              {perMejaSorted.length === 0 && (
                <tr>
                  <Td colSpan={3} className="text-center text-ink-3 py-4">
                    Belum ada transaksi.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableWrap>
      </section>

      <section>
        <h2 className="font-medium text-ink mb-3">Riwayat transaksi per kasir</h2>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Kasir</Th>
                <Th className="text-right">Jumlah transaksi</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {[...perKasir.values()].map((v) => (
                <Tr key={v.nama}>
                  <Td>{v.nama}</Td>
                  <Td align="right" className="font-numeric">
                    {v.jumlah}
                  </Td>
                  <Td align="right" className="font-numeric">
                    {formatRupiah(v.total)}
                  </Td>
                </Tr>
              ))}
              {perKasir.size === 0 && (
                <tr>
                  <Td colSpan={3} className="text-center text-ink-3 py-4">
                    Belum ada transaksi.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableWrap>
      </section>

      <section>
        <h2 className="font-medium text-ink mb-3">Log pembatalan item</h2>
        <Card className="divide-y divide-rule-2">
          {voidRows.map((v) => (
            <div key={v.id} className="px-4 py-2 text-sm">
              <div className="flex justify-between">
                <span>
                  {v.qty}x {v.nama_item}
                </span>
                <span className="text-ink-3">{formatWaktu(v.dibatalkan_pada)}</span>
              </div>
              <p className="text-xs text-ink-3">
                {v.profiles?.display_name ?? "-"} — {v.alasan_batal}
              </p>
            </div>
          ))}
          {voidRows.length === 0 && (
            <p className="px-4 py-4 text-sm text-ink-3">Tidak ada pembatalan pada periode ini.</p>
          )}
        </Card>
      </section>

      <section>
        <h2 className="font-medium text-ink mb-3">Log meja dan pesanan dibatalkan</h2>
        <Card className="divide-y divide-rule-2">
          {cancelledOrderRows.map((c) => (
            <div key={c.id} className="px-4 py-2 text-sm">
              <div className="flex justify-between">
                <span>{c.tables ? `Meja ${c.tables.nomor}` : `Pesanan WA ${c.kode ?? ""}`}</span>
                <span className="text-ink-3">{formatWaktu(c.dibatalkan_pada)}</span>
              </div>
              <p className="text-xs text-ink-3">
                {c.profiles?.display_name ?? "-"} — {c.alasan_batal}
              </p>
            </div>
          ))}
          {cancelledOrderRows.length === 0 && (
            <p className="px-4 py-4 text-sm text-ink-3">Tidak ada pembatalan pada periode ini.</p>
          )}
        </Card>
      </section>
    </main>
  );
}
