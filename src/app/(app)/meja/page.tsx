import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import TableGrid from "@/components/table-grid";

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
          <h1 className="text-lg font-semibold text-stone-800">Belum ada shift terbuka</h1>
          <p className="text-sm text-stone-500">
            Buka shift dan masukkan modal kas awal sebelum melayani meja.
          </p>
          <Link
            href="/shift"
            className="inline-block rounded-lg bg-amber-700 text-white px-4 py-2 text-sm font-medium"
          >
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
    <main className="flex-1 p-4">
      <h1 className="text-xl font-semibold text-stone-800 mb-4">Meja</h1>
      <TableGrid tables={tables ?? []} />
    </main>
  );
}
