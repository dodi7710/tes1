"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PHOTO_BUCKET = "produk";
const PHOTO_MAX_BYTES = 900 * 1024; // under the 1MB server action body limit
const PHOTO_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

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
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      nama: input.nama.trim(),
      harga: input.harga,
      kategori_id: input.kategoriId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/meja");
  return data.id;
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

/** Storage path inside the bucket, parsed back out of a stored public URL. */
function photoPathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/object/public/${PHOTO_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

async function getCurrentPhotoUrl(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("menu_items").select("foto_url").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data.foto_url;
}

/** MENU-4: the client compresses the photo first; this only validates and stores it. */
export async function uploadMenuItemPhoto(id: string, formData: FormData) {
  await requireSession("pemilik");
  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) throw new Error("Foto belum dipilih");
  const ext = PHOTO_TYPES[file.type];
  if (!ext) throw new Error("Format foto harus WebP, JPEG, atau PNG");
  if (file.size > PHOTO_MAX_BYTES) throw new Error("Ukuran foto terlalu besar (maks. 900 KB)");

  const oldPath = photoPathFromUrl(await getCurrentPhotoUrl(id));

  // Uploads go through the service role so the bucket needs no write policy;
  // the pemilik check above is the access control.
  const admin = createAdminClient();
  const path = `${id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (uploadError) throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);

  const { data } = admin.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update({ foto_url: data.publicUrl }).eq("id", id);
  if (error) {
    await admin.storage.from(PHOTO_BUCKET).remove([path]);
    throw new Error(error.message);
  }

  if (oldPath) await admin.storage.from(PHOTO_BUCKET).remove([oldPath]);
  revalidatePath("/menu");
  revalidatePath("/meja");
}

export async function removeMenuItemPhoto(id: string) {
  await requireSession("pemilik");
  const oldPath = photoPathFromUrl(await getCurrentPhotoUrl(id));

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update({ foto_url: null }).eq("id", id);
  if (error) throw new Error(error.message);

  if (oldPath) await createAdminClient().storage.from(PHOTO_BUCKET).remove([oldPath]);
  revalidatePath("/menu");
  revalidatePath("/meja");
}
