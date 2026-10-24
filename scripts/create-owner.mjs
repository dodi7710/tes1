// Creates the first pemilik account on a fresh Supabase project, where nobody
// can log in yet to use Pengaturan > Kelola Akun. Same steps as
// createKasirAccount in src/app/actions/staff.ts.
//
//   node --env-file=.env.local scripts/create-owner.mjs "Nama Pemilik" 123456

import { createClient } from "@supabase/supabase-js";

const [displayName, pin] = process.argv.slice(2);
if (!displayName?.trim() || !/^\d{4,6}$/.test(pin ?? "")) {
  console.error('Pakai: node --env-file=.env.local scripts/create-owner.mjs "Nama" <PIN 4-6 digit>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib ada di .env.local");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email: `pending-${crypto.randomUUID()}@kasir.local`,
  password: pin,
  email_confirm: true,
});
if (createErr) throw createErr;

const id = created.user.id;
const { error: renameErr } = await admin.auth.admin.updateUserById(id, {
  email: `${id}@kasir.local`,
  email_confirm: true,
});
if (renameErr) throw renameErr;

const { error: profileErr } = await admin
  .from("profiles")
  .insert({ id, display_name: displayName.trim(), role: "pemilik", status_aktif: true });
if (profileErr) throw profileErr;

console.log(`Akun pemilik "${displayName.trim()}" dibuat. Login pakai PIN yang tadi diketik.`);
