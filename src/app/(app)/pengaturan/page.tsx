// Hallmark · family: crud-admin · design-system: design.md
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import StoreSettingsForm from "@/components/store-settings-form";
import StaffManager from "@/components/staff-manager";
import ChangePinForm from "@/components/change-pin-form";
import PageHeader from "@/components/ui/page-header";

export default async function PengaturanPage() {
  const supabase = await createClient();
  const me = await getSessionProfile();

  const [{ data: settings }, { data: staff }] = await Promise.all([
    supabase.from("store_settings").select("nama_warung, alamat").eq("id", 1).single(),
    supabase.from("profiles").select("id, display_name, role, status_aktif").order("display_name"),
  ]);

  return (
    <main className="flex-1 p-4 max-w-2xl w-full mx-auto space-y-8">
      <PageHeader title="Pengaturan" subtitle="Data toko untuk struk, dan akun staff." />

      <section>
        <h2 className="font-medium text-ink mb-3">Data toko (untuk struk)</h2>
        <StoreSettingsForm initial={settings ?? { nama_warung: "", alamat: "" }} />
      </section>

      <section>
        <h2 className="font-medium text-ink mb-3">Akun staff</h2>
        <StaffManager staff={staff ?? []} myId={me?.id ?? ""} />
      </section>

      <section>
        <h2 className="font-medium text-ink mb-3">PIN saya</h2>
        <ChangePinForm />
      </section>
    </main>
  );
}
