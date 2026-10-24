// Hallmark · family: crud-admin · design-system: design.md
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatWaktu } from "@/lib/format";
import { formatWa, waStatus, WA_STATUS_LABEL, WA_STATUS_TONE, type WaStatus } from "@/lib/wa";
import PageHeader from "@/components/ui/page-header";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button-classes";

const FILTERS = [
  { key: "aktif", label: "Perlu diproses" },
  { key: "belum_bayar", label: "Menunggu bayar" },
  { key: "lunas", label: "Siap diambil" },
  { key: "diambil", label: "Selesai" },
  { key: "batal", label: "Batal" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

export default async function PesananPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === statusParam) ? (statusParam as FilterKey) : "aktif";

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, kode, status, no_wa, nama_pelanggan, waktu_ambil, dibuka_pada, diambil_pada, order_items(qty, harga_saat_itu, status)")
    .eq("jenis", "wa")
    .order("dibuka_pada", { ascending: filter === "aktif" })
    .limit(100);

  if (filter === "aktif") query = query.or("status.eq.terbuka,and(status.eq.lunas,diambil_pada.is.null)");
  else if (filter === "belum_bayar") query = query.eq("status", "terbuka");
  else if (filter === "lunas") query = query.eq("status", "lunas").is("diambil_pada", null);
  else if (filter === "diambil") query = query.eq("status", "lunas").not("diambil_pada", "is", null);
  else query = query.eq("status", "dibatalkan");

  const { data: orders, error } = await query;

  const rows = (orders ?? []).map((o) => ({
    ...o,
    total: o.order_items
      .filter((i) => i.status === "aktif")
      .reduce((s, i) => s + i.qty * Number(i.harga_saat_itu), 0),
    jumlah: o.order_items.filter((i) => i.status === "aktif").reduce((s, i) => s + i.qty, 0),
    st: waStatus(o) as WaStatus,
  }));

  return (
    <main className="flex-1 p-4 max-w-3xl w-full mx-auto space-y-4">
      <PageHeader
        title="Pesanan WA"
        subtitle="Pesanan dari WhatsApp yang diambil sendiri oleh pelanggan."
        actions={
          <Link href="/pesanan/baru" className={buttonClasses({ size: "sm" })}>
            + Pesanan baru
          </Link>
        }
      />

      <nav className="flex gap-1 overflow-x-auto -mx-1 px-1" aria-label="Filter status">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "aktif" ? "/pesanan" : `/pesanan?status=${f.key}`}
            aria-current={filter === f.key ? "page" : undefined}
            className={`min-h-10 flex items-center whitespace-nowrap rounded-input px-3 text-sm font-medium transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              filter === f.key ? "bg-accent-2 text-accent" : "text-ink-2 hover:bg-paper-2"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {error && (
        <p className="rounded-input bg-danger-bg border border-danger/25 text-danger text-sm px-3 py-2">
          Gagal memuat pesanan: {error.message}
        </p>
      )}

      <Card as="ul" className="divide-y divide-rule-2">
        {rows.map((o) => (
          <li key={o.id}>
            <Link
              href={`/pesanan/${o.id}`}
              className="flex items-start gap-3 px-4 py-3 hover:bg-paper-2 transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-numeric text-sm font-semibold text-ink">{o.kode}</span>
                  <Badge tone={WA_STATUS_TONE[o.st]}>{WA_STATUS_LABEL[o.st]}</Badge>
                </div>
                <p className="text-sm text-ink truncate mt-0.5">
                  {o.nama_pelanggan ? `${o.nama_pelanggan} · ` : ""}
                  {o.no_wa ? formatWa(o.no_wa) : "-"}
                </p>
                <p className="text-xs text-ink-3 mt-0.5">
                  {o.jumlah} item · dibuat {formatWaktu(o.dibuka_pada)}
                  {o.waktu_ambil ? ` · ambil ${o.waktu_ambil}` : ""}
                </p>
              </div>
              <span className="font-numeric text-sm font-medium text-ink-2 shrink-0">{formatRupiah(o.total)}</span>
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-ink-3">
            {filter === "aktif" ? "Tidak ada pesanan yang perlu diproses." : "Belum ada pesanan di sini."}
          </li>
        )}
      </Card>
    </main>
  );
}
