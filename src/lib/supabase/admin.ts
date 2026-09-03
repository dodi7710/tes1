import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Privileged Supabase client using the service role key — bypasses RLS.
 * Server-side use ONLY (server actions / route handlers), and only after
 * verifying the caller's role is 'pemilik' yourself. Never import this
 * from a Client Component; `server-only` will fail the build if you try.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local — ambil dari Supabase Dashboard > Project Settings > API.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
