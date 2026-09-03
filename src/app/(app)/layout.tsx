import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/top-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("store_settings")
    .select("nama_warung")
    .eq("id", 1)
    .single();

  return (
    <div className="min-h-dvh flex flex-col bg-stone-50">
      <TopBar
        displayName={profile.display_name}
        role={profile.role}
        storeName={settings?.nama_warung ?? "Warung Susu Murni"}
      />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
