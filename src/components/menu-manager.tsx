// Hallmark · family: crud-admin · design-system: design.md
"use client";

import { useState, useTransition } from "react";
import { createCategory, createMenuItem, setMenuItemActive, updateMenuItem } from "@/app/actions/menu";
import { formatRupiah, parseRupiah } from "@/lib/format";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

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
        <p className="rounded-input bg-danger-bg border border-danger/25 text-danger text-sm px-3 py-2">{error}</p>
      )}

      <Card as="form" onSubmit={submitNewItem} className="p-4 space-y-3">
        <h2 className="font-medium text-ink">Tambah item menu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-2">
          <Input required placeholder="Nama menu" value={newNama} onChange={(e) => setNewNama(e.target.value)} />
          <Input
            required
            placeholder="Harga"
            inputMode="numeric"
            value={newHarga}
            onChange={(e) => setNewHarga(e.target.value)}
          />
          <Select value={newKategori} onChange={(e) => setNewKategori(e.target.value)}>
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </Select>
          <Button type="submit" loading={isPending}>
            Tambah
          </Button>
        </div>
      </Card>

      {grouped.map(({ category, items: catItems }) => (
        <section key={category.id}>
          <h3 className="text-xs font-medium uppercase tracking-wide text-ink-3 mb-2">{category.nama}</h3>
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
          <h3 className="text-xs font-medium uppercase tracking-wide text-ink-3 mb-2">Tanpa kategori</h3>
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
        <Input
          placeholder="Nama kategori baru"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="max-w-xs min-h-10"
        />
        <Button type="submit" variant="ghost" size="sm" loading={isPending}>
          + Tambah kategori
        </Button>
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
    <Card as="ul" className="divide-y divide-rule-2">
      {items.map((item) =>
        editing === item.id ? (
          <EditRow key={item.id} item={item} categories={categories} onDone={() => setEditing(null)} runAction={runAction} />
        ) : (
          <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`flex-1 text-sm ${item.status_aktif ? "text-ink" : "text-ink-3 line-through"}`}>
              {item.nama}
            </span>
            <span className="font-numeric text-sm font-medium text-ink-2">{formatRupiah(item.harga)}</span>
            <button
              onClick={() => setEditing(item.id)}
              className="text-xs font-medium text-ink-2 hover:text-accent transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-input px-1"
            >
              Ubah
            </button>
            <button
              disabled={isPending}
              onClick={() => runAction(() => setMenuItemActive(item.id, !item.status_aktif))}
              className="text-xs font-medium text-ink-2 hover:text-accent disabled:opacity-50 transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-input px-1"
            >
              {item.status_aktif ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </li>
        ),
      )}
      {items.length === 0 && <li className="px-4 py-3 text-sm text-ink-3">Belum ada item.</li>}
    </Card>
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
    <li className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-accent-2/30">
      <Input value={nama} onChange={(e) => setNama(e.target.value)} className="flex-1 min-w-[8rem] min-h-10" />
      <Input value={harga} onChange={(e) => setHarga(e.target.value)} inputMode="numeric" className="w-28 min-h-10" />
      <Select value={kategoriId} onChange={(e) => setKategoriId(e.target.value)} className="min-h-10 w-auto">
        <option value="">Tanpa kategori</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nama}
          </option>
        ))}
      </Select>
      <Button
        size="sm"
        onClick={() =>
          runAction(async () => {
            await updateMenuItem(item.id, { nama, harga: parseRupiah(harga), kategoriId: kategoriId || null });
            onDone();
          })
        }
      >
        Simpan
      </Button>
      <Button variant="ghost" size="sm" onClick={onDone}>
        Batal
      </Button>
    </li>
  );
}
