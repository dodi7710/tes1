import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/database";

export type SessionProfile = {
  id: string;
  display_name: string;
  role: Role;
  status_aktif: boolean;
};

/** Current logged-in staff member, or null. Safe to call from Server Components/actions. */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, status_aktif")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.status_aktif) return null;
  return profile as SessionProfile;
}

/** Throws if nobody is logged in, or (when role given) the wrong role is logged in. */
export async function requireSession(role?: Role): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Belum login");
  if (role && profile.role !== role) throw new Error("Tidak punya akses");
  return profile;
}
