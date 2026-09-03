"use client";

import { useState, useTransition } from "react";
import { createCategory, createMenuItem, setMenuItemActive, updateMenuItem } from "@/app/actions/menu";
import { formatRupiah, parseRupiah } from "@/lib/format";

type Category = { id: string; nama: string; urutan: number };
type Item = { id: string; nama: string; harga: number; kategori_id: string | null; status_aktif: boolean };

export default function MenuManager({ categories, items }: { categories: Category[]; items: Item[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const [newNama, setNewNama] = useState("");
  const [newHarga, setNewHarga] = useState("");
  const [newKategori, setNewKategori] = useState(categories[0]?.id ?? "");
  const [newCategoryName, setNewCategoryName] = useState("");

  function runAction(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal menyimpan");
      }
    });
  }

  function submitNewItem(e: React.FormEvent) {
    e.preventDefault();
    runAction(async () => {
      await createMenuItem({ nama: newNama, harga: parseRupiah(newHarga), kategoriId: newKategori || null });
      setNewNama("");
      setNewHarga("");
    });
  }

  function submitNewCategory(e: React.FormEvent) {
    e.preventDefault();
    runAction(async () => {
      await createCategory(newCategoryName);
      setNewCategoryName("");
    });
  }

  const grouped = categories.map((c) => ({
    category: c,
    items: items.filter((i) => i.kategori_id === c.id),
  }));
  const uncategorized = items.filter((i) => !i.kategori_id);

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</p>
      )}

      <form onSubmit={submitNewItem} className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
        <h2 className="font-medium text-stone-800">Tambah item menu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-2">
          <input
            required
            placeholder="Nama menu"
            value={newNama}
            onChange={(e) => setNewNama(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Harga"
            inputMode="numeric"
            value={newHarga}
            onChange={(e) => setNewHarga(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <select
            value={newKategori}
            onChange={(e) => setNewKategori(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>
          <button
            disabled={isPending}
            className="rounded-lg bg-amber-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Tambah
          </button>
        </div>
      </form>

      {grouped.map(({ category, items: catItems }) => (
        <section key={category.id}>
          <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-2">{category.nama}</h3>
          <MenuItemList
            items={catItems}
            categories={categories}
            editing={editing}
            setEditing={setEditing}
            runAction={runAction}
            isPending={isPending}
          />
        </section>
      ))}

      {uncategorized.length > 0 && (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-2">Tanpa kategori</h3>
          <MenuItemList
            items={uncategorized}
            categories={categories}
            editing={editing}
            setEditing={setEditing}
            runAction={runAction}
            isPending={isPending}
          />
        </section>
      )}

      <form onSubmit={submitNewCategory} className="flex gap-2 items-center">
        <input
          placeholder="Nama kategori baru"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
        />
        <button disabled={isPending} className="text-sm font-medium text-amber-800 hover:underline">
          + Tambah kategori
        </button>
      </form>
    </div>
  );
}

function MenuItemList({
  items,
  categories,
  editing,
  setEditing,
  runAction,
  isPending,
}: {
  items: Item[];
  categories: Category[];
  editing: string | null;
  setEditing: (id: string | null) => void;
  runAction: (fn: () => Promise<unknown>) => void;
  isPending: boolean;
}) {
  return (
    <ul className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
      {items.map((item) =>
        editing === item.id ? (
          <EditRow
            key={item.id}
            item={item}
            categories={categories}
            onDone={() => setEditing(null)}
            runAction={runAction}
          />
        ) : (
          <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`flex-1 text-sm ${item.status_aktif ? "text-stone-800" : "text-stone-400 line-through"}`}>
              {item.nama}
            </span>
            <span className="text-sm font-medium text-stone-600 tabular-nums">{formatRupiah(item.harga)}</span>
            <button
              onClick={() => setEditing(item.id)}
              className="text-xs font-medium text-stone-500 hover:text-amber-700"
            >
              Ubah
            </button>
            <button
              disabled={isPending}
              onClick={() => runAction(() => setMenuItemActive(item.id, !item.status_aktif))}
              className="text-xs font-medium text-stone-500 hover:text-amber-700 disabled:opacity-50"
            >
              {item.status_aktif ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </li>
        ),
      )}
      {items.length === 0 && <li className="px-4 py-3 text-sm text-stone-400">Belum ada item.</li>}
    </ul>
  );
}

function EditRow({
  item,
  categories,
  onDone,
  runAction,
}: {
  item: Item;
  categories: Category[];
  onDone: () => void;
  runAction: (fn: () => Promise<unknown>) => void;
}) {
  const [nama, setNama] = useState(item.nama);
  const [harga, setHarga] = useState(String(item.harga));
  const [kategoriId, setKategoriId] = useState(item.kategori_id ?? "");

  return (
    <li className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-amber-50/50">
      <input
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        className="flex-1 min-w-[8rem] rounded-lg border border-stone-300 px-2 py-1 text-sm"
      />
      <input
        value={harga}
        onChange={(e) => setHarga(e.target.value)}
        inputMode="numeric"
        className="w-28 rounded-lg border border-stone-300 px-2 py-1 text-sm"
      />
      <select
        value={kategoriId}
        onChange={(e) => setKategoriId(e.target.value)}
        className="rounded-lg border border-stone-300 px-2 py-1 text-sm"
      >
        <option value="">Tanpa kategori</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nama}
          </option>
        ))}
      </select>
      <button
        onClick={() =>
          runAction(async () => {
            await updateMenuItem(item.id, { nama, harga: parseRupiah(harga), kategoriId: kategoriId || null });
            onDone();
          })
        }
        className="rounded-lg bg-amber-700 text-white px-3 py-1 text-xs font-medium"
      >
        Simpan
      </button>
      <button onClick={onDone} className="text-xs font-medium text-stone-500">
        Batal
      </button>
    </li>
  );
}
