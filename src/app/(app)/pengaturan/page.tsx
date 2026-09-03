import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import StoreSettingsForm from "@/components/store-settings-form";
import StaffManager from "@/components/staff-manager";
import ChangePinForm from "@/components/change-pin-form";

export default async function PengaturanPage() {
  const supabase = await createClient();
  const me = await getSessionProfile();

  const [{ data: settings }, { data: staff }] = await Promise.all([
    supabase.from("store_settings").select("nama_warung, alamat").eq("id", 1).single(),
    supabase.from("profiles").select("id, display_name, role, status_aktif").order("display_name"),
  ]);

  return (
    <main className="flex-1 p-4 max-w-2xl w-full mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-stone-800 mb-1">Pengaturan</h1>
        <p className="text-sm text-stone-500">Data toko untuk struk, dan akun staff.</p>
      </div>

      <section>
        <h2 className="font-medium text-stone-800 mb-3">Data toko (untuk struk)</h2>
        <StoreSettingsForm initial={settings ?? { nama_warung: "", alamat: "" }} />
      </section>

      <section>
        <h2 className="font-medium text-stone-800 mb-3">Akun staff</h2>
        <StaffManager staff={staff ?? []} myId={me?.id ?? ""} />
      </section>

      <section>
        <h2 className="font-medium text-stone-800 mb-3">PIN saya</h2>
        <ChangePinForm />
      </section>
    </main>
  );
}
