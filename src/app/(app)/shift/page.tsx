import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import ShiftPanel from "@/components/shift-panel";
import { formatRupiah, formatWaktu } from "@/lib/format";

export default async function ShiftPage() {
  const supabase = await createClient();
  const me = await getSessionProfile();
  if (!me) return null;

  const { data: myOpenShift } = await supabase
    .from("shifts")
    .select("id, modal_awal, waktu_buka, status")
    .eq("kasir_id", me.id)
    .eq("status", "buka")
    .maybeSingle();

  let runningCash = 0;
  if (myOpenShift) {
    const { data: cashPayments } = await supabase
      .from("payments")
      .select("total")
      .eq("shift_id", myOpenShift.id)
      .eq("metode", "tunai");
    runningCash = (cashPayments ?? []).reduce((sum, p) => sum + Number(p.total), 0);
  }

  let history: {
    id: string;
    kasir_id: string;
    modal_awal: number;
    kas_fisik_akhir: number | null;
    selisih: number | null;
    waktu_buka: string;
    waktu_tutup: string | null;
    status: string;
    profiles: { display_name: string } | null;
  }[] = [];

  if (me.role === "pemilik") {
    const { data } = await supabase
      .from("shifts")
      .select(
        "id, kasir_id, modal_awal, kas_fisik_akhir, selisih, waktu_buka, waktu_tutup, status, profiles(display_name)",
      )
      .order("waktu_buka", { ascending: false })
      .limit(50);
    history = (data ?? []) as unknown as typeof history;
  }

  return (
    <main className="flex-1 p-4 max-w-2xl w-full mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-stone-800 mb-1">Shift Kasir</h1>
        <p className="text-sm text-stone-500">Buka shift sebelum melayani transaksi pertama.</p>
      </div>

      <ShiftPanel
        openShift={
          myOpenShift
            ? {
                id: myOpenShift.id,
                modalAwal: Number(myOpenShift.modal_awal),
                waktuBuka: myOpenShift.waktu_buka,
                runningCash,
              }
            : null
        }
      />

      {me.role === "pemilik" && (
        <section>
          <h2 className="font-medium text-stone-800 mb-3">Riwayat shift (semua kasir)</h2>
          <div className="rounded-xl border border-stone-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-100">
                  <th className="px-4 py-2 font-medium">Kasir</th>
                  <th className="px-4 py-2 font-medium">Buka</th>
                  <th className="px-4 py-2 font-medium">Tutup</th>
                  <th className="px-4 py-2 font-medium text-right">Modal</th>
                  <th className="px-4 py-2 font-medium text-right">Kas akhir</th>
                  <th className="px-4 py-2 font-medium text-right">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-stone-50 last:border-0">
                    <td className="px-4 py-2">{h.profiles?.display_name ?? "-"}</td>
                    <td className="px-4 py-2 text-stone-500">{formatWaktu(h.waktu_buka)}</td>
                    <td className="px-4 py-2 text-stone-500">
                      {h.waktu_tutup ? formatWaktu(h.waktu_tutup) : <span className="text-emerald-600">Sedang buka</span>}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatRupiah(h.modal_awal)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {h.kas_fisik_akhir !== null ? formatRupiah(h.kas_fisik_akhir) : "-"}
                    </td>
                    <td
                      className={`px-4 py-2 text-right tabular-nums font-medium ${
                        h.selisih === null ? "" : h.selisih === 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {h.selisih !== null ? formatRupiah(h.selisih) : "-"}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-stone-400">
                      Belum ada riwayat shift.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
