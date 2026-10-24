"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { normalizeWa } from "@/lib/wa";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type WaOrderInput = {
  noWa: string;
  namaPelanggan: string;
  waktuAmbil: string;
  catatan: string;
  items: { menuItemId: string; qty: number }[];
};

async function getMyOpenShiftId(supabase: Supabase, kasirId: string) {
  const { data } = await supabase
    .from("shifts")
    .select("id")
    .eq("kasir_id", kasirId)
    .eq("status", "buka")
    .maybeSingle();
  return data?.id ?? null;
}

function validate(input: WaOrderInput) {
  const noWa = normalizeWa(input.noWa);
  if (!noWa) throw new Error("Nomor WA tidak valid. Contoh: 0851-8506-6599");
  const items = input.items.filter((i) => i.qty > 0);
  if (items.length === 0) throw new Error("Pilih minimal satu produk");
  if (items.some((i) => !Number.isInteger(i.qty) || i.qty > 999)) throw new Error("Jumlah produk tidak valid");
  return {
    noWa,
    items,
    namaPelanggan: input.namaPelanggan.trim() || null,
    waktuAmbil: input.waktuAmbil.trim() || null,
    catatan: input.catatan.trim() || null,
  };
}

/** Prices always come from the database, never from the client. */
async function insertItems(supabase: Supabase, orderId: string, items: { menuItemId: string; qty: number }[]) {
  const { data: menu, error: menuErr } = await supabase
    .from("menu_items")
    .select("id, nama, harga")
    .in(
      "id",
      items.map((i) => i.menuItemId),
    );
  if (menuErr) throw new Error(menuErr.message);
  const byId = new Map((menu ?? []).map((m) => [m.id, m]));

  const rows = items.map((i) => {
    const m = byId.get(i.menuItemId);
    if (!m) throw new Error("Ada produk yang sudah tidak tersedia, muat ulang halaman");
    return {
      order_id: orderId,
      menu_item_id: m.id,
      nama_item: m.nama,
      harga_saat_itu: m.harga,
      qty: i.qty,
    };
  });
  const { error } = await supabase.from("order_items").insert(rows);
  if (error) throw new Error(error.message);
}

async function getWaOrder(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, jenis, status, diambil_pada")
    .eq("id", id)
    .single();
  if (error || !data || data.jenis !== "wa") throw new Error("Pesanan tidak ditemukan");
  return data;
}

function revalidate(id?: string) {
  revalidatePath("/pesanan");
  if (id) revalidatePath(`/pesanan/${id}`);
  revalidatePath("/laporan");
  revalidatePath("/shift");
}

/** WA-1, WA-2: admin records an order a customer sent over WhatsApp. */
export async function createWaOrder(input: WaOrderInput): Promise<string> {
  const session = await requireSession();
  const v = validate(input);
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      jenis: "wa",
      no_wa: v.noWa,
      nama_pelanggan: v.namaPelanggan,
      waktu_ambil: v.waktuAmbil,
      catatan: v.catatan,
      dibuka_oleh: session.id,
      shift_id: await getMyOpenShiftId(supabase, session.id),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  try {
    await insertItems(supabase, order.id, v.items);
  } catch (e) {
    await supabase.from("orders").delete().eq("id", order.id);
    throw e;
  }

  revalidate(order.id);
  return order.id;
}

/** WA-7: edit while unpaid. Items are replaced wholesale; who/when is recorded. */
export async function updateWaOrder(id: string, input: WaOrderInput) {
  const session = await requireSession();
  const v = validate(input);
  const supabase = await createClient();

  const order = await getWaOrder(supabase, id);
  if (order.status !== "terbuka") throw new Error("Pesanan yang sudah dibayar atau dibatalkan tidak bisa diubah");

  const { error } = await supabase
    .from("orders")
    .update({
      no_wa: v.noWa,
      nama_pelanggan: v.namaPelanggan,
      waktu_ambil: v.waktuAmbil,
      catatan: v.catatan,
      diubah_oleh: session.id,
      diubah_pada: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  const { error: delErr } = await supabase.from("order_items").delete().eq("order_id", id);
  if (delErr) throw new Error(delErr.message);
  await insertItems(supabase, id, v.items);

  revalidate(id);
}

/**
 * BAYAR-5: the admin ticks "Sudah dibayar" after checking the money arrived.
 * COD is cash into the drawer, so it needs the admin's open shift (SHIFT-4).
 */
export async function markWaOrderPaid(id: string, metode: "qris" | "transfer" | "tunai") {
  const session = await requireSession();
  if (!["qris", "transfer", "tunai"].includes(metode)) throw new Error("Metode bayar tidak valid");
  const supabase = await createClient();

  const order = await getWaOrder(supabase, id);
  if (order.status !== "terbuka") throw new Error("Pesanan ini sudah dibayar atau dibatalkan");

  const shiftId = await getMyOpenShiftId(supabase, session.id);
  if (metode === "tunai" && !shiftId) throw new Error("Buka shift dulu untuk mencatat COD (tunai masuk laci).");

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select("qty, harga_saat_itu")
    .eq("order_id", id)
    .eq("status", "aktif");
  if (itemsErr) throw new Error(itemsErr.message);
  const total = (items ?? []).reduce((s, i) => s + i.qty * Number(i.harga_saat_itu), 0);
  if (total <= 0) throw new Error("Pesanan ini belum ada item");

  const { error: payErr } = await supabase.from("payments").insert({
    order_id: id,
    metode,
    subtotal: total,
    diskon: 0,
    total,
    jumlah_dibayar: total,
    kembalian: 0,
    kasir_id: session.id,
    shift_id: shiftId,
  });
  if (payErr) throw new Error(payErr.message);

  const { error } = await supabase
    .from("orders")
    .update({ status: "lunas", ditutup_pada: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidate(id);
}

/** Pemilik-only undo for a mistaken "Sudah dibayar" tick, before pickup. */
export async function unmarkWaOrderPaid(id: string) {
  await requireSession("pemilik");
  const supabase = await createClient();

  const order = await getWaOrder(supabase, id);
  if (order.status !== "lunas") throw new Error("Pesanan ini belum dibayar");
  if (order.diambil_pada) throw new Error("Pesanan sudah diambil, pembayaran tidak bisa dibatalkan");

  const { error: delErr } = await supabase.from("payments").delete().eq("order_id", id);
  if (delErr) throw new Error(delErr.message);

  const { error } = await supabase.from("orders").update({ status: "terbuka", ditutup_pada: null }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidate(id);
}

export async function markWaOrderPickedUp(id: string) {
  const session = await requireSession();
  const supabase = await createClient();

  const order = await getWaOrder(supabase, id);
  if (order.status !== "lunas") throw new Error("Tandai sudah dibayar dulu sebelum diambil");
  if (order.diambil_pada) throw new Error("Pesanan sudah ditandai diambil");

  const { error } = await supabase
    .from("orders")
    .update({ diambil_oleh: session.id, diambil_pada: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidate(id);
}
