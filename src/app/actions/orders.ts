"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

async function getMyOpenShiftId(supabase: Awaited<ReturnType<typeof createClient>>, kasirId: string) {
  const { data } = await supabase
    .from("shifts")
    .select("id")
    .eq("kasir_id", kasirId)
    .eq("status", "buka")
    .maybeSingle();
  return data?.id ?? null;
}

export async function openTable(mejaId: string): Promise<string> {
  const session = await requireSession();
  const supabase = await createClient();

  const shiftId = await getMyOpenShiftId(supabase, session.id);
  if (!shiftId) throw new Error("Buka shift dulu sebelum melayani meja.");

  const { data: order, error } = await supabase
    .from("orders")
    .insert({ meja_id: mejaId, shift_id: shiftId, dibuka_oleh: session.id })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Meja ini sudah ada pesanan terbuka.");
    throw new Error(error.message);
  }

  await supabase.from("tables").update({ status: "terisi" }).eq("id", mejaId);

  revalidatePath("/meja");
  return order.id;
}

export async function addOrderItem(
  orderId: string,
  menuItemId: string,
  qty = 1,
  catatan: string | null = null,
) {
  await requireSession();
  if (qty < 1) throw new Error("Qty minimal 1");
  const supabase = await createClient();

  const { data: menuItem, error: menuErr } = await supabase
    .from("menu_items")
    .select("nama, harga")
    .eq("id", menuItemId)
    .single();
  if (menuErr || !menuItem) throw new Error("Item menu tidak ditemukan");

  const { data: item, error } = await supabase
    .from("order_items")
    .insert({
      order_id: orderId,
      menu_item_id: menuItemId,
      nama_item: menuItem.nama,
      harga_saat_itu: menuItem.harga,
      qty,
      catatan: catatan?.trim() || null,
    })
    .select("id, nama_item, harga_saat_itu, qty, catatan")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/meja`);
  return item;
}

export async function markItemsPrinted(itemIds: string[]) {
  if (itemIds.length === 0) return;
  const supabase = await createClient();
  await supabase.from("order_items").update({ dicetak_dapur: true }).in("id", itemIds);
}

export async function voidOrderItem(itemId: string, alasan: string) {
  const session = await requireSession();
  if (!alasan.trim()) throw new Error("Alasan pembatalan wajib diisi");

  const supabase = await createClient();
  const { error } = await supabase
    .from("order_items")
    .update({
      status: "dibatalkan",
      alasan_batal: alasan.trim(),
      dibatalkan_oleh: session.id,
      dibatalkan_pada: new Date().toISOString(),
    })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath("/meja");
}

/**
 * Cancels an entire open tab without payment — e.g. it was opened by
 * mistake, or the customer left before ordering. Frees the table back to
 * kosong. Requires a reason, same audit pattern as voidOrderItem.
 */
export async function cancelOrder(orderId: string, alasan: string) {
  const session = await requireSession();
  if (!alasan.trim()) throw new Error("Alasan pembatalan wajib diisi");

  const supabase = await createClient();
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, meja_id, status")
    .eq("id", orderId)
    .single();
  if (orderErr || !order) throw new Error("Pesanan tidak ditemukan");
  if (order.status !== "terbuka") throw new Error("Pesanan ini sudah tidak aktif");

  const { error } = await supabase
    .from("orders")
    .update({
      status: "dibatalkan",
      alasan_batal: alasan.trim(),
      dibatalkan_oleh: session.id,
      dibatalkan_pada: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) throw new Error(error.message);

  await supabase.from("tables").update({ status: "kosong" }).eq("id", order.meja_id);

  revalidatePath("/meja");
  revalidatePath("/laporan");
}

export async function createPayment(input: {
  orderId: string;
  metode: "tunai" | "qris";
  diskon: number;
  jumlahDibayar: number | null;
}) {
  const session = await requireSession();
  const supabase = await createClient();

  const shiftId = await getMyOpenShiftId(supabase, session.id);
  if (!shiftId) throw new Error("Shift Anda tidak aktif.");

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, meja_id, status")
    .eq("id", input.orderId)
    .single();
  if (orderErr || !order) throw new Error("Pesanan tidak ditemukan");
  if (order.status !== "terbuka") throw new Error("Pesanan sudah lunas");

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select("qty, harga_saat_itu")
    .eq("order_id", input.orderId)
    .eq("status", "aktif");
  if (itemsErr) throw new Error(itemsErr.message);
  if (!items || items.length === 0) throw new Error("Belum ada item aktif di pesanan ini");

  const subtotal = items.reduce((sum, i) => sum + i.qty * Number(i.harga_saat_itu), 0);
  const diskon = Math.min(Math.max(input.diskon, 0), subtotal);
  const total = subtotal - diskon;
  const jumlahDibayar = input.metode === "tunai" ? input.jumlahDibayar ?? 0 : total;
  if (input.metode === "tunai" && jumlahDibayar < total) {
    throw new Error("Uang dibayar kurang dari total");
  }
  const kembalian = input.metode === "tunai" ? jumlahDibayar - total : 0;

  const { error: payErr } = await supabase.from("payments").insert({
    order_id: input.orderId,
    metode: input.metode,
    subtotal,
    diskon,
    total,
    jumlah_dibayar: jumlahDibayar,
    kembalian,
    kasir_id: session.id,
    shift_id: shiftId,
  });
  if (payErr) throw new Error(payErr.message);

  await supabase
    .from("orders")
    .update({ status: "lunas", ditutup_pada: new Date().toISOString() })
    .eq("id", input.orderId);
  await supabase.from("tables").update({ status: "kosong" }).eq("id", order.meja_id);

  revalidatePath("/meja");
  revalidatePath("/laporan");
  revalidatePath("/shift");

  return { subtotal, diskon, total, jumlahDibayar, kembalian };
}
