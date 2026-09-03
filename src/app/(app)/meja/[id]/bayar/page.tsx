import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import PaymentForm from "@/components/payment-form";

export default async function BayarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: mejaId } = await params;
  const supabase = await createClient();
  const me = await getSessionProfile();

  const { data: table } = await supabase.from("tables").select("id, nomor").eq("id", mejaId).single();
  if (!table) notFound();

  // Not filtered to status='terbuka': after a successful payment, Next.js
  // automatically revalidates this page (the server action calls
  // revalidatePath). If we hard 404'd on a now-'lunas' order, we'd blow away
  // the client's in-flight receipt-printing UI right as it needs to show the
  // result. Fetch the latest order regardless of status and branch instead.
  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("meja_id", mejaId)
    .order("dibuka_pada", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!order) notFound();

  if (order.status !== "terbuka") {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-lg font-semibold text-stone-800">Meja {table.nomor} sudah dibayar</h1>
          <p className="text-sm text-stone-500">Pesanan ini sudah lunas dan meja sudah dikosongkan.</p>
          <Link href="/meja" className="inline-block rounded-lg bg-amber-700 text-white px-4 py-2 text-sm font-medium">
            Kembali ke Meja
          </Link>
        </div>
      </main>
    );
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id, nama_item, harga_saat_itu, qty")
    .eq("order_id", order.id)
    .eq("status", "aktif");

  const { data: settings } = await supabase
    .from("store_settings")
    .select("nama_warung, alamat")
    .eq("id", 1)
    .single();

  return (
    <PaymentForm
      table={table}
      orderId={order.id}
      items={items ?? []}
      storeName={settings?.nama_warung ?? "Warung Susu Murni"}
      storeAddress={settings?.alamat ?? null}
      kasirName={me?.display_name ?? "-"}
    />
  );
}
