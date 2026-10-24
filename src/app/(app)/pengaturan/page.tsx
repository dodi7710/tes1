// Hallmark · family: crud-admin · design-system: design.md
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import StoreSettingsForm from "@/components/store-settings-form";
import StaffManager from "@/components/staff-manager";
import ChangePinForm from "@/components/change-pin-form";
import PrinterSettings from "@/components/printer-settings";
import PageHeader from "@/components/ui/page-header";

export default async function PengaturanPage() {
  const me = await getSessionProfile();
  const isPemilik = me?.role === "pemilik";

  // Kasir see only Printer and their own PIN; the store data and staff
  // accounts stay with the owner (the proxy no longer blocks this page).
  let ownerData = null;
  if (isPemilik) {
    const supabase = await createClient();
    const [{ data: settings }, { data: staff }] = await Promise.all([
      supabase
        .from("store_settings")
        .select("nama_warung, alamat, alamat_ambil, info_pembayaran_wa")
        .eq("id", 1)
        .single(),
      supabase.from("profiles").select("id, display_name, role, status_aktif").order("display_name"),
    ]);
    ownerData = { settings, staff };
  }

  return (
    <main className="flex-1 p-4 max-w-2xl w-full mx-auto space-y-8">
      <PageHeader
        title="Pengaturan"
        subtitle={isPemilik ? "Printer, data toko untuk struk, dan akun staff." : "Printer dan PIN Anda."}
      />

      <section>
        <h2 className="font-bold text-ink mb-3">Printer struk</h2>
        <PrinterSettings />
      </section>

      {ownerData && (
        <>
          <section>
            <h2 className="font-bold text-ink mb-3">Data toko (struk dan pesan WA)</h2>
            <StoreSettingsForm
              initial={ownerData.settings ?? { nama_warung: "", alamat: "", alamat_ambil: "", info_pembayaran_wa: "" }}
            />
          </section>

          <section>
            <h2 className="font-bold text-ink mb-3">Akun staff</h2>
            <StaffManager staff={ownerData.staff ?? []} myId={me?.id ?? ""} />
          </section>
        </>
      )}

      <section>
        <h2 className="font-bold text-ink mb-3">PIN saya</h2>
        <ChangePinForm />
      </section>
    </main>
  );
}
