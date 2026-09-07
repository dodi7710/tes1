// Hallmark · family: dashboard-grid · design-system: design.md
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import TableGrid from "@/components/table-grid";
import PageHeader from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";

export default async function MejaPage() {
  const supabase = await createClient();
  const me = await getSessionProfile();
  if (!me) return null;

  const { data: myOpenShift } = await supabase
    .from("shifts")
    .select("id")
    .eq("kasir_id", me.id)
    .eq("status", "buka")
    .maybeSingle();

  if (!myOpenShift) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="font-display text-lg font-semibold text-ink">Belum ada shift terbuka</h1>
          <p className="text-sm text-ink-2">Buka shift dan masukkan modal kas awal sebelum melayani meja.</p>
          <Link href="/shift" className={buttonClasses({ className: "inline-flex" })}>
            Buka Shift
          </Link>
        </div>
      </main>
    );
  }

  const { data: tables } = await supabase
    .from("tables")
    .select("id, nomor, status")
    .order("nomor");

  return (
    <main className="flex-1 p-4 space-y-4">
      <PageHeader title="Meja" />
      <TableGrid tables={tables ?? []} />
    </main>
  );
}
