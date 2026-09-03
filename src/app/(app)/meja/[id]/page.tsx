import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderDetail from "@/components/order-detail";

export default async function MejaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: mejaId } = await params;
  const supabase = await createClient();

  const { data: table } = await supabase.from("tables").select("id, nomor").eq("id", mejaId).single();
  if (!table) notFound();

  const { data: order } = await supabase
    .from("orders")
    .select("id, dibuka_pada")
    .eq("meja_id", mejaId)
    .eq("status", "terbuka")
    .maybeSingle();

  const [{ data: items }, { data: categories }, { data: menuItems }] = await Promise.all([
    order
      ? supabase
          .from("order_items")
          .select("id, nama_item, harga_saat_itu, qty, status, alasan_batal, dicetak_dapur")
          .eq("order_id", order.id)
          .order("dibuat_pada")
      : Promise.resolve({ data: [] }),
    supabase.from("menu_categories").select("id, nama, urutan").order("urutan"),
    supabase
      .from("menu_items")
      .select("id, nama, harga, kategori_id")
      .eq("status_aktif", true)
      .order("nama"),
  ]);

  return (
    <OrderDetail
      table={table}
      order={order ?? null}
      items={items ?? []}
      categories={categories ?? []}
      menuItems={menuItems ?? []}
    />
  );
}
