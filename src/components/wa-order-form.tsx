// Hallmark · family: transactional-workbench · design-system: design.md
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWaOrder, updateWaOrder } from "@/app/actions/pesanan";
import { formatRupiah } from "@/lib/format";
import { formatWa, normalizeWa } from "@/lib/wa";
import ProductPhoto from "@/components/product-photo";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

type Category = { id: string; nama: string };
type Product = { id: string; nama: string; harga: number; kategori_id: string | null; foto_url: string | null };

export type WaOrderInitial = {
  id: string;
  noWa: string;
  namaPelanggan: string;
  waktuAmbil: string;
  catatan: string;
  qty: Record<string, number>;
};

export default function WaOrderForm({
  categories,
  products,
  initial,
}: {
  categories: Category[];
  products: Product[];
  initial?: WaOrderInitial;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [noWa, setNoWa] = useState(initial ? formatWa(initial.noWa) : "");
  const [nama, setNama] = useState(initial?.namaPelanggan ?? "");
  const [waktuAmbil, setWaktuAmbil] = useState(initial?.waktuAmbil ?? "");
  const [catatan, setCatatan] = useState(initial?.catatan ?? "");
  const [qty, setQty] = useState<Record<string, number>>(initial?.qty ?? {});
  const [cari, setCari] = useState("");

  const normalized = normalizeWa(noWa);
  const chosen = products.filter((p) => (qty[p.id] ?? 0) > 0);
  const total = chosen.reduce((s, p) => s + p.harga * qty[p.id], 0);
  const jumlahItem = chosen.reduce((s, p) => s + qty[p.id], 0);

  const visible = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return q ? products.filter((p) => p.nama.toLowerCase().includes(q)) : products;
  }, [cari, products]);
  const groups = [
    ...categories.map((c) => ({ key: c.id, nama: c.nama, items: visible.filter((p) => p.kategori_id === c.id) })),
    { key: "lainnya", nama: "Lainnya", items: visible.filter((p) => !p.kategori_id) },
  ].filter((g) => g.items.length > 0);

  function change(id: string, delta: number) {
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(999, (q[id] ?? 0) + delta)) }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!normalized) {
      setError("Nomor WA tidak valid. Contoh: 0851-8506-6599");
      return;
    }
    if (chosen.length === 0) {
      setError("Pilih minimal satu produk");
      return;
    }
    const input = {
      noWa,
      namaPelanggan: nama,
      waktuAmbil,
      catatan,
      items: chosen.map((p) => ({ menuItemId: p.id, qty: qty[p.id] })),
    };
    startTransition(async () => {
      try {
        if (initial) {
          await updateWaOrder(initial.id, input);
          router.push(`/pesanan/${initial.id}`);
        } else {
          const id = await createWaOrder(input);
          router.push(`/pesanan/${id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan pesanan");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col md:flex-row gap-4 md:items-start">
      <div className="flex-1 min-w-0 space-y-4">
        <Card className="p-4 space-y-3">
          <h2 className="font-medium text-ink">Pelanggan</h2>
          <label className="block">
            <span className="text-xs font-medium text-ink-2">No. WhatsApp</span>
            <Input
              required
              inputMode="tel"
              autoComplete="off"
              placeholder="0851-8506-6599"
              value={noWa}
              onChange={(e) => setNoWa(e.target.value)}
              aria-invalid={noWa.length > 4 && !normalized}
              className="mt-1"
            />
            {noWa.length > 4 && !normalized && (
              <span className="mt-1 block text-xs text-danger">Nomor belum valid, cek lagi.</span>
            )}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-ink-2">Nama (opsional)</span>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} className="mt-1" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink-2">Waktu ambil (opsional)</span>
              <Input
                placeholder="mis. besok jam 4 sore"
                value={waktuAmbil}
                onChange={(e) => setWaktuAmbil(e.target.value)}
                className="mt-1"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-ink-2">Catatan (opsional)</span>
            <Textarea rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="mt-1 min-h-16" />
          </label>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium text-ink">Produk</h2>
            <Input
              type="search"
              placeholder="Cari produk"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className="max-w-48 min-h-10"
            />
          </div>
          {groups.map((g) => (
            <div key={g.key}>
              <h3 className="text-xs font-medium uppercase tracking-wide text-ink-3 mb-2">{g.nama}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {g.items.map((p) => (
                  <ProductQtyTile key={p.id} product={p} qty={qty[p.id] ?? 0} onChange={(d) => change(p.id, d)} />
                ))}
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="text-sm text-ink-3">Produk tidak ditemukan.</p>}
        </Card>
      </div>

      {/* Persistent rail — order summary and save */}
      <aside className="md:w-80 shrink-0 space-y-3 md:sticky md:top-20 md:self-start">
        <Card className="p-4 space-y-2">
          <h2 className="font-medium text-ink">Ringkasan</h2>
          {chosen.length === 0 ? (
            <p className="text-sm text-ink-3">Belum ada produk. Ketuk produk untuk menambah.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {chosen.map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span className="text-ink">
                    {p.nama} <span className="text-ink-3">x{qty[p.id]}</span>
                  </span>
                  <span className="font-numeric text-ink-2 shrink-0">{formatRupiah(p.harga * qty[p.id])}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="flex items-center justify-between rounded-card bg-ink text-paper px-4 py-3">
          <span className="text-sm font-medium">Total{jumlahItem > 0 ? ` · ${jumlahItem} item` : ""}</span>
          <span className="font-numeric text-lg font-semibold">{formatRupiah(total)}</span>
        </div>
        {error && (
          <p className="rounded-input bg-danger-bg border border-danger/25 text-danger text-sm px-3 py-2">{error}</p>
        )}
        <Button type="submit" size="lg" fullWidth loading={isPending}>
          {initial ? "Simpan perubahan" : "Simpan pesanan"}
        </Button>
      </aside>
    </form>
  );
}

function ProductQtyTile({
  product,
  qty,
  onChange,
}: {
  product: Product;
  qty: number;
  onChange: (delta: number) => void;
}) {
  const selected = qty > 0;
  return (
    <div
      className={`overflow-hidden rounded-input border text-sm transition-colors duration-short ease-out ${
        selected ? "border-accent ring-1 ring-accent" : "border-rule"
      }`}
    >
      <button
        type="button"
        onClick={() => onChange(1)}
        aria-label={`Tambah ${product.nama}`}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <ProductPhoto src={product.foto_url} alt="" className="aspect-square w-full" sizes="(min-width: 640px) 200px, 45vw" />
        <div className="px-3 pt-2">
          <div className="font-medium text-ink leading-snug">{product.nama}</div>
          <div className="font-numeric text-xs text-ink-3">{formatRupiah(product.harga)}</div>
        </div>
      </button>
      <div className="flex items-center justify-between gap-1 px-2 py-2">
        <button
          type="button"
          onClick={() => onChange(-1)}
          disabled={!selected}
          aria-label={`Kurangi ${product.nama}`}
          className="size-10 rounded-input border border-rule text-lg text-ink disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          −
        </button>
        <span className={`font-numeric font-semibold ${selected ? "text-accent" : "text-ink-3"}`} aria-live="polite">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => onChange(1)}
          aria-label={`Tambah ${product.nama}`}
          className="size-10 rounded-input border border-rule text-lg text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          +
        </button>
      </div>
    </div>
  );
}
