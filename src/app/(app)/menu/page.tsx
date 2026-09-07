// Hallmark · family: crud-admin · design-system: design.md
import { createClient } from "@/lib/supabase/server";
import MenuManager from "@/components/menu-manager";
import PageHeader from "@/components/ui/page-header";

export default async function MenuPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("menu_categories").select("id, nama, urutan").order("urutan"),
    supabase
      .from("menu_items")
      .select("id, nama, harga, kategori_id, status_aktif")
      .order("nama"),
  ]);

  return (
    <main className="flex-1 p-4 max-w-3xl w-full mx-auto space-y-6">
      <PageHeader
        title="Kelola Menu"
        subtitle="Menu sederhana: nama dan satu harga tetap per item (tanpa varian/topping)."
      />
      <MenuManager categories={categories ?? []} items={items ?? []} />
    </main>
  );
}
