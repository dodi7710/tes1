// Hallmark · family: crud-admin · design-system: design.md
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import ShiftPanel from "@/components/shift-panel";
import { formatRupiah, formatWaktu } from "@/lib/format";
import PageHeader from "@/components/ui/page-header";
import { TableWrap, Table, Th, Tr, Td } from "@/components/ui/table";
import Badge from "@/components/ui/badge";

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
      <PageHeader title="Shift Kasir" subtitle="Buka shift sebelum melayani transaksi pertama." />

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
          <h2 className="font-medium text-ink mb-3">Riwayat shift (semua kasir)</h2>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Kasir</Th>
                  <Th>Buka</Th>
                  <Th>Tutup</Th>
                  <Th className="text-right">Modal</Th>
                  <Th className="text-right">Kas akhir</Th>
                  <Th className="text-right">Selisih</Th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <Tr key={h.id}>
                    <Td>{h.profiles?.display_name ?? "-"}</Td>
                    <Td className="text-ink-2">{formatWaktu(h.waktu_buka)}</Td>
                    <Td className="text-ink-2">
                      {h.waktu_tutup ? formatWaktu(h.waktu_tutup) : <Badge tone="success">Sedang buka</Badge>}
                    </Td>
                    <Td align="right" className="font-numeric">
                      {formatRupiah(h.modal_awal)}
                    </Td>
                    <Td align="right" className="font-numeric">
                      {h.kas_fisik_akhir !== null ? formatRupiah(h.kas_fisik_akhir) : "-"}
                    </Td>
                    <Td
                      align="right"
                      className={`font-numeric font-medium ${
                        h.selisih === null ? "" : h.selisih === 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {h.selisih !== null ? formatRupiah(h.selisih) : "-"}
                    </Td>
                  </Tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <Td colSpan={6} className="text-center text-ink-3 py-6">
                      Belum ada riwayat shift.
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableWrap>
        </section>
      )}
    </main>
  );
}
