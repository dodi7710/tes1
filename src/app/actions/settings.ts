"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function updateStoreSettings(input: { namaWarung: string; alamat: string }) {
  await requireSession("pemilik");
  if (!input.namaWarung.trim()) throw new Error("Nama warung wajib diisi");

  const supabase = await createClient();
  const { error } = await supabase
    .from("store_settings")
    .update({ nama_warung: input.namaWarung.trim(), alamat: input.alamat.trim() || null })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/pengaturan");
  revalidatePath("/(app)", "layout");
}
