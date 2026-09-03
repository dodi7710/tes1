import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth/session";
import LoginForm from "@/components/login-form";

export default async function LoginPage() {
  const existing = await getSessionProfile();
  if (existing) redirect("/meja");

  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("profiles")
    .select("id, display_name, role")
    .eq("status_aktif", true)
    .order("display_name");

  return <LoginForm staff={staff ?? []} />;
}
