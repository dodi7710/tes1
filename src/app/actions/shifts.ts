"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function openShift(modalAwal: number) {
  const session = await requireSession();
  if (modalAwal < 0) throw new Error("Modal awal tidak boleh negatif");

  const supabase = await createClient();
  const { error } = await supabase.from("shifts").insert({
    kasir_id: session.id,
    modal_awal: modalAwal,
    status: "buka",
  });
  if (error) {
    if (error.code === "23505") throw new Error("Anda sudah punya shift yang terbuka.");
    throw new Error(error.message);
  }

  revalidatePath("/meja");
  revalidatePath("/shift");
}

export async function closeShift(shiftId: string, kasFisikAkhir: number) {
  const session = await requireSession();
  if (kasFisikAkhir < 0) throw new Error("Jumlah kas tidak boleh negatif");

  const supabase = await createClient();

  const { data: shift, error: shiftErr } = await supabase
    .from("shifts")
    .select("id, kasir_id, modal_awal, status")
    .eq("id", shiftId)
    .single();
  if (shiftErr || !shift) throw new Error("Shift tidak ditemukan");
  if (shift.kasir_id !== session.id) throw new Error("Bukan shift Anda");
  if (shift.status !== "buka") throw new Error("Shift sudah ditutup");

  const { data: cashPayments, error: payErr } = await supabase
    .from("payments")
    .select("total")
    .eq("shift_id", shiftId)
    .eq("metode", "tunai");
  if (payErr) throw new Error(payErr.message);

  const totalTunai = (cashPayments ?? []).reduce((sum, p) => sum + Number(p.total), 0);
  const expected = Number(shift.modal_awal) + totalTunai;
  const selisih = kasFisikAkhir - expected;

  const { error } = await supabase
    .from("shifts")
    .update({
      status: "tutup",
      kas_fisik_akhir: kasFisikAkhir,
      selisih,
      waktu_tutup: new Date().toISOString(),
    })
    .eq("id", shiftId);
  if (error) throw new Error(error.message);

  revalidatePath("/meja");
  revalidatePath("/shift");

  return { totalTunai, expected, selisih };
}
