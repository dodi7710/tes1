// Hallmark · family: transactional-workbench · design-system: design.md
import { createClient } from "@/lib/supabase/server";
import WaOrderForm from "@/components/wa-order-form";
import PageHeader from "@/components/ui/page-header";

export default async function PesananBaruPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("menu_categories").select("id, nama").order("urutan"),
    supabase
      .from("menu_items")
      .select("id, nama, harga, kategori_id, foto_url")
      .eq("status_aktif", true)
      .order("nama"),
  ]);

  return (
    <main className="flex-1 p-4 max-w-5xl w-full mx-auto space-y-4">
      <PageHeader title="Pesanan WA baru" back={{ href: "/pesanan", label: "Pesanan WA" }} />
      <WaOrderForm categories={categories ?? []} products={products ?? []} />
    </main>
  );
}
