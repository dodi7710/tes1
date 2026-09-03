"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(nama: string) {
  await requireSession("pemilik");
  if (!nama.trim()) throw new Error("Nama kategori wajib diisi");

  const supabase = await createClient();
  const { error } = await supabase.from("menu_categories").insert({ nama: nama.trim() });
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
}

export async function createMenuItem(input: { nama: string; harga: number; kategoriId: string | null }) {
  await requireSession("pemilik");
  if (!input.nama.trim()) throw new Error("Nama menu wajib diisi");
  if (input.harga < 0) throw new Error("Harga tidak boleh negatif");

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").insert({
    nama: input.nama.trim(),
    harga: input.harga,
    kategori_id: input.kategoriId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/meja");
}

export async function updateMenuItem(
  id: string,
  input: { nama: string; harga: number; kategoriId: string | null },
) {
  await requireSession("pemilik");
  if (!input.nama.trim()) throw new Error("Nama menu wajib diisi");
  if (input.harga < 0) throw new Error("Harga tidak boleh negatif");

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ nama: input.nama.trim(), harga: input.harga, kategori_id: input.kategoriId })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/meja");
}

export async function setMenuItemActive(id: string, active: boolean) {
  await requireSession("pemilik");
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update({ status_aktif: active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/meja");
}
