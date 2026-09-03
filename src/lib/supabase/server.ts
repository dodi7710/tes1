import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components / Server Actions / Route Handlers.
 * Reads the caller's session from cookies and still enforces RLS with the
 * anon key — this is NOT an admin client. Use lib/supabase/admin.ts for
 * privileged operations (creating kasir accounts, etc).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component during render — the middleware
            // refreshes the session cookie instead, so this is safe to ignore.
          }
        },
      },
    },
  );
}
