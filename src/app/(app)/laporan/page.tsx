import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatWaktu } from "@/lib/format";

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

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const { periode: periodeParam } = await searchParams;
  const periode: Periode =
    periodeParam === "minggu" || periodeParam === "bulan" ? periodeParam : "hari";
  const { start, end, label } = rangeFor(periode);

  const supabase = await createClient();

  const [{ data: payments }, { data: paidOrders }, { data: voids }, { data: cancelledOrders }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, metode, total, dibuat_pada, kasir_id, profiles(display_name)")
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
      .select("id, alasan_batal, dibatalkan_pada, tables(nomor), profiles!orders_dibatalkan_oleh_fkey(display_name)")
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
  }[];

  const omzetTotal = paymentRows.reduce((s, p) => s + Number(p.total), 0);
  const tunaiTotal = paymentRows.filter((p) => p.metode === "tunai").reduce((s, p) => s + Number(p.total), 0);
  const qrisTotal = paymentRows.filter((p) => p.metode === "qris").reduce((s, p) => s + Number(p.total), 0);

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
    const nomor = raw.orders?.tables?.nomor ?? 0;
    const entry = perMeja.get(nomor) ?? { jumlahTransaksi: 0, omzet: 0 };
    entry.omzet += raw.qty * Number(raw.harga_saat_itu);
    perMeja.set(nomor, entry);
  }
  for (const o of orderRows) {
    const nomor = o.tables?.nomor ?? 0;
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
    alasan_batal: string | null;
    dibatalkan_pada: string;
    tables: { nomor: number } | null;
    profiles: { display_name: string } | null;
  }[];

  return (
    <main className="flex-1 p-4 max-w-3xl w-full mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-stone-800 mb-1">Laporan</h1>
        <div className="flex gap-2 mt-2">
          {(["hari", "minggu", "bulan"] as const).map((p) => (
            <Link
              key={p}
              href={`/laporan?periode=${p}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                periode === p ? "bg-amber-100 text-amber-900" : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              {p === "hari" ? "Hari ini" : p === "minggu" ? "Minggu ini" : "Bulan ini"}
            </Link>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs text-stone-400">Omzet — {label}</p>
          <p className="text-lg font-semibold text-stone-800 tabular-nums">{formatRupiah(omzetTotal)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs text-stone-400">Tunai</p>
          <p className="text-lg font-semibold text-stone-800 tabular-nums">{formatRupiah(tunaiTotal)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs text-stone-400">QRIS</p>
          <p className="text-lg font-semibold text-stone-800 tabular-nums">{formatRupiah(qrisTotal)}</p>
        </div>
      </section>

      <section>
        <h2 className="font-medium text-stone-800 mb-3">Menu terlaris</h2>
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
          {bestSellersSorted.map(([nama, qty]) => (
            <div key={nama} className="flex justify-between px-4 py-2 text-sm">
              <span>{nama}</span>
              <span className="tabular-nums font-medium">{qty}x</span>
            </div>
          ))}
          {bestSellersSorted.length === 0 && (
            <p className="px-4 py-4 text-sm text-stone-400">Belum ada penjualan pada periode ini.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-stone-800 mb-3">Omzet per meja</h2>
        <div className="rounded-xl border border-stone-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-100">
                <th className="px-4 py-2 font-medium">Meja</th>
                <th className="px-4 py-2 font-medium text-right">Transaksi</th>
                <th className="px-4 py-2 font-medium text-right">Omzet</th>
              </tr>
            </thead>
            <tbody>
              {perMejaSorted.map(([nomor, v]) => (
                <tr key={nomor} className="border-b border-stone-50 last:border-0">
                  <td className="px-4 py-2">Meja {nomor}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{v.jumlahTransaksi}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatRupiah(v.omzet)}</td>
                </tr>
              ))}
              {perMejaSorted.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-stone-400">
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-medium text-stone-800 mb-3">Riwayat transaksi per kasir</h2>
        <div className="rounded-xl border border-stone-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-100">
                <th className="px-4 py-2 font-medium">Kasir</th>
                <th className="px-4 py-2 font-medium text-right">Jumlah transaksi</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...perKasir.values()].map((v) => (
                <tr key={v.nama} className="border-b border-stone-50 last:border-0">
                  <td className="px-4 py-2">{v.nama}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{v.jumlah}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatRupiah(v.total)}</td>
                </tr>
              ))}
              {perKasir.size === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-stone-400">
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-medium text-stone-800 mb-3">Log pembatalan item</h2>
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
          {voidRows.map((v) => (
            <div key={v.id} className="px-4 py-2 text-sm">
              <div className="flex justify-between">
                <span>
                  {v.qty}x {v.nama_item}
                </span>
                <span className="text-stone-400">{formatWaktu(v.dibatalkan_pada)}</span>
              </div>
              <p className="text-xs text-stone-400">
                {v.profiles?.display_name ?? "-"} — {v.alasan_batal}
              </p>
            </div>
          ))}
          {voidRows.length === 0 && (
            <p className="px-4 py-4 text-sm text-stone-400">Tidak ada pembatalan pada periode ini.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-stone-800 mb-3">Log meja dibatalkan</h2>
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
          {cancelledOrderRows.map((c) => (
            <div key={c.id} className="px-4 py-2 text-sm">
              <div className="flex justify-between">
                <span>Meja {c.tables?.nomor ?? "-"}</span>
                <span className="text-stone-400">{formatWaktu(c.dibatalkan_pada)}</span>
              </div>
              <p className="text-xs text-stone-400">
                {c.profiles?.display_name ?? "-"} — {c.alasan_batal}
              </p>
            </div>
          ))}
          {cancelledOrderRows.length === 0 && (
            <p className="px-4 py-4 text-sm text-stone-400">Tidak ada meja yang dibatalkan pada periode ini.</p>
          )}
        </div>
      </section>
    </main>
  );
}
