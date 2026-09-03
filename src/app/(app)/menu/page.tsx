import { createClient } from "@/lib/supabase/server";
import MenuManager from "@/components/menu-manager";

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
    <main className="flex-1 p-4 max-w-3xl w-full mx-auto">
      <h1 className="text-xl font-semibold text-stone-800 mb-1">Kelola Menu</h1>
      <p className="text-sm text-stone-500 mb-6">
        Menu sederhana: nama dan satu harga tetap per item (tanpa varian/topping).
      </p>
      <MenuManager categories={categories ?? []} items={items ?? []} />
    </main>
  );
}
