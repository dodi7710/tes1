"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loginEmailFor } from "@/lib/auth/login-email";

function assertValidPin(pin: string) {
  if (!/^\d{4,6}$/.test(pin)) throw new Error("PIN harus 4-6 digit angka");
}

export async function createKasirAccount(displayName: string, role: "kasir" | "pemilik", pin: string) {
  await requireSession("pemilik");
  assertValidPin(pin);
  if (!displayName.trim()) throw new Error("Nama wajib diisi");

  const admin = createAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: `pending-${crypto.randomUUID()}@kasir.local`,
    password: pin,
    email_confirm: true,
  });
  if (createErr) throw new Error(createErr.message);

  const id = created.user.id;
  const { error: renameErr } = await admin.auth.admin.updateUserById(id, {
    email: loginEmailFor(id),
    email_confirm: true,
  });
  if (renameErr) throw new Error(renameErr.message);

  const { error: profileErr } = await admin
    .from("profiles")
    .insert({ id, display_name: displayName.trim(), role, status_aktif: true });
  if (profileErr) throw new Error(profileErr.message);

  revalidatePath("/pengaturan");
}

export async function resetKasirPin(profileId: string, newPin: string) {
  await requireSession("pemilik");
  assertValidPin(newPin);

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(profileId, { password: newPin });
  if (error) throw new Error(error.message);

  revalidatePath("/pengaturan");
}

export async function setKasirActive(profileId: string, active: boolean) {
  const session = await requireSession("pemilik");
  if (profileId === session.id && !active) {
    throw new Error("Tidak bisa menonaktifkan akun sendiri");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status_aktif: active })
    .eq("id", profileId);
  if (error) throw new Error(error.message);

  revalidatePath("/pengaturan");
}

/** Any logged-in staff member changes their own PIN — no admin privileges needed. */
export async function changeOwnPin(newPin: string) {
  const session = await requireSession();
  assertValidPin(newPin);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPin });
  if (error) throw new Error(error.message);

  return session.id;
}
