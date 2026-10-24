"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loginEmailFor, pinToPassword } from "@/lib/auth/login-email";

/**
 * Errors are returned, not thrown: in production Next.js replaces a thrown
 * server-action error with a generic message (React error #441), so the
 * owner would never see "PIN harus 4-6 digit" or Supabase's own reason.
 */
type Result = { error?: string };

function pinError(pin: string): string | null {
  return /^\d{4,6}$/.test(pin) ? null : "PIN harus 4-6 digit angka";
}

export async function createKasirAccount(
  displayName: string,
  role: "kasir" | "pemilik",
  pin: string,
): Promise<Result> {
  await requireSession("pemilik");
  const invalid = pinError(pin);
  if (invalid) return { error: invalid };
  if (!displayName.trim()) return { error: "Nama wajib diisi" };

  const admin = createAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: `pending-${crypto.randomUUID()}@kasir.local`,
    password: pinToPassword(pin),
    email_confirm: true,
  });
  if (createErr) return { error: createErr.message };

  const id = created.user.id;
  const { error: renameErr } = await admin.auth.admin.updateUserById(id, {
    email: loginEmailFor(id),
    email_confirm: true,
  });
  if (renameErr) {
    await admin.auth.admin.deleteUser(id);
    return { error: renameErr.message };
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .insert({ id, display_name: displayName.trim(), role, status_aktif: true });
  if (profileErr) {
    await admin.auth.admin.deleteUser(id);
    return { error: profileErr.message };
  }

  revalidatePath("/pengaturan");
  return {};
}

export async function resetKasirPin(profileId: string, newPin: string): Promise<Result> {
  await requireSession("pemilik");
  const invalid = pinError(newPin);
  if (invalid) return { error: invalid };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(profileId, { password: pinToPassword(newPin) });
  if (error) return { error: error.message };

  revalidatePath("/pengaturan");
  return {};
}

export async function setKasirActive(profileId: string, active: boolean): Promise<Result> {
  const session = await requireSession("pemilik");
  if (profileId === session.id && !active) {
    return { error: "Tidak bisa menonaktifkan akun sendiri" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status_aktif: active })
    .eq("id", profileId);
  if (error) return { error: error.message };

  revalidatePath("/pengaturan");
  return {};
}

/** Any logged-in staff member changes their own PIN — no admin privileges needed. */
export async function changeOwnPin(newPin: string): Promise<Result> {
  await requireSession();
  const invalid = pinError(newPin);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: pinToPassword(newPin) });
  if (error) return { error: error.message };

  return {};
}
