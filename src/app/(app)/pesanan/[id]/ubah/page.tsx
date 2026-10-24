// Hallmark · family: transactional-workbench · design-system: design.md
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WaOrderForm from "@/components/wa-order-form";
import PageHeader from "@/components/ui/page-header";

export default async function UbahPesananPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, jenis, kode, status, no_wa, nama_pelanggan, waktu_ambil, catatan, order_items(menu_item_id, qty, status)")
    .eq("id", id)
    .maybeSingle();
  if (!order || order.jenis !== "wa" || !order.no_wa) notFound();
  if (order.status !== "terbuka") redirect(`/pesanan/${id}`);

  const qty: Record<string, number> = {};
  for (const it of order.order_items) {
    if (it.status === "aktif") qty[it.menu_item_id] = (qty[it.menu_item_id] ?? 0) + it.qty;
  }

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("menu_categories").select("id, nama").order("urutan"),
    supabase
      .from("menu_items")
      .select("id, nama, harga, kategori_id, foto_url, status_aktif")
      .order("nama"),
  ]);
  // Keep a product that has since been deactivated if this order still uses it.
  const visible = (products ?? []).filter((p) => p.status_aktif || qty[p.id]);

  return (
    <main className="flex-1 p-4 max-w-5xl w-full mx-auto space-y-4">
      <PageHeader title={`Ubah pesanan ${order.kode}`} back={{ href: `/pesanan/${id}`, label: "Batal" }} />
      <WaOrderForm
        categories={categories ?? []}
        products={visible}
        initial={{
          id,
          noWa: order.no_wa,
          namaPelanggan: order.nama_pelanggan ?? "",
          waktuAmbil: order.waktu_ambil ?? "",
          catatan: order.catatan ?? "",
          qty,
        }}
      />
    </main>
  );
}
