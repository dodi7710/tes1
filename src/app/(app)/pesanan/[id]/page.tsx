// Hallmark · family: transactional-workbench · design-system: design.md
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import WaOrderDetail from "@/components/wa-order-detail";

export default async function PesananDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const me = await getSessionProfile();
  if (!me) return null;

  const [{ data: order }, { data: settings }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, jenis, kode, status, no_wa, nama_pelanggan, waktu_ambil, catatan,
         dibuka_pada, diubah_pada, diambil_pada, alasan_batal, dibatalkan_pada,
         pembuat:profiles!orders_dibuka_oleh_fkey(display_name),
         pengubah:profiles!orders_diubah_oleh_fkey(display_name),
         pengambil:profiles!orders_diambil_oleh_fkey(display_name),
         pembatal:profiles!orders_dibatalkan_oleh_fkey(display_name),
         order_items(id, nama_item, qty, harga_saat_itu, status),
         payments(metode, total, dibuat_pada, profiles(display_name))`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("store_settings").select("nama_warung, alamat_ambil, info_pembayaran_wa").eq("id", 1).single(),
  ]);
  if (!order || order.jenis !== "wa" || !order.kode || !order.no_wa) notFound();

  const payment = order.payments[0] ?? null;

  return (
    <WaOrderDetail
      isPemilik={me.role === "pemilik"}
      order={{
        id: order.id,
        kode: order.kode,
        status: order.status,
        noWa: order.no_wa,
        namaPelanggan: order.nama_pelanggan,
        waktuAmbil: order.waktu_ambil,
        catatan: order.catatan,
        dibukaPada: order.dibuka_pada,
        dibukaOleh: order.pembuat?.display_name ?? null,
        diubahPada: order.diubah_pada,
        diubahOleh: order.pengubah?.display_name ?? null,
        diambilPada: order.diambil_pada,
        diambilOleh: order.pengambil?.display_name ?? null,
        dibatalkanPada: order.dibatalkan_pada,
        dibatalkanOleh: order.pembatal?.display_name ?? null,
        alasanBatal: order.alasan_batal,
        items: order.order_items
          .filter((i) => i.status === "aktif")
          .map((i) => ({ id: i.id, nama_item: i.nama_item, qty: i.qty, harga_saat_itu: Number(i.harga_saat_itu) })),
        payment: payment
          ? { metode: payment.metode, dibuatPada: payment.dibuat_pada, oleh: payment.profiles?.display_name ?? null }
          : null,
      }}
      store={{
        nama: settings?.nama_warung ?? "Susu Moerni",
        alamatAmbil: settings?.alamat_ambil ?? null,
        infoPembayaran: settings?.info_pembayaran_wa ?? null,
      }}
    />
  );
}
