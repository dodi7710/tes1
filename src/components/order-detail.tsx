"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addOrderItem, markItemsPrinted, openTable, voidOrderItem } from "@/app/actions/orders";
import { usePrinter } from "@/components/printer-provider";
import { buildKitchenTicket } from "@/lib/print/templates";
import { formatRupiah, formatWaktu } from "@/lib/format";

type Item = {
  id: string;
  nama_item: string;
  harga_saat_itu: number;
  qty: number;
  status: string;
  alasan_batal: string | null;
  dicetak_dapur: boolean;
};
type Category = { id: string; nama: string; urutan: number };
type MenuItem = { id: string; nama: string; harga: number; kategori_id: string | null };

export default function OrderDetail({
  table,
  order,
  items,
  categories,
  menuItems,
}: {
  table: { id: string; nomor: number };
  order: { id: string; dibuka_pada: string } | null;
  items: Item[];
  categories: Category[];
  menuItems: MenuItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [voidTarget, setVoidTarget] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const printer = usePrinter();
  const router = useRouter();

  if (!order) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-stone-600">Meja {table.nomor} belum ada pesanan aktif.</p>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await openTable(table.id);
                  router.refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Gagal");
                }
              })
            }
            className="rounded-lg bg-amber-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Buka Meja
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </main>
    );
  }

  const activeItems = items.filter((i) => i.status === "aktif");
  const cancelledItems = items.filter((i) => i.status === "dibatalkan");
  const total = activeItems.reduce((s, i) => s + i.qty * i.harga_saat_itu, 0);
  const unprinted = activeItems.filter((i) => !i.dicetak_dapur);

  async function printKitchenTicket(ticketItems: Item[]) {
    if (ticketItems.length === 0 || !order) return;
    const bytes = buildKitchenTicket({
      nomorMeja: table.nomor,
      items: ticketItems.map((i) => ({ nama_item: i.nama_item, qty: i.qty })),
      waktu: new Date().toISOString(),
    });
    const result = await printer.print(bytes);
    if (result.ok) {
      await markItemsPrinted(ticketItems.map((i) => i.id));
      router.refresh();
    }
    return result;
  }

  function addItem(menuItem: MenuItem) {
    setError(null);
    startTransition(async () => {
      try {
        const inserted = await addOrderItem(order!.id, menuItem.id, 1);
        router.refresh();
        await printKitchenTicket([
          {
            id: inserted.id,
            nama_item: inserted.nama_item,
            harga_saat_itu: inserted.harga_saat_itu,
            qty: inserted.qty,
            status: "aktif",
            alasan_batal: null,
            dicetak_dapur: false,
          },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal menambah item");
      }
    });
  }

  function submitVoid(itemId: string, alasan: string) {
    setError(null);
    startTransition(async () => {
      try {
        await voidOrderItem(itemId, alasan);
        setVoidTarget(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal membatalkan item");
      }
    });
  }

  const grouped = categories.map((c) => ({ category: c, items: menuItems.filter((m) => m.kategori_id === c.id) }));
  const uncategorized = menuItems.filter((m) => !m.kategori_id);

  return (
    <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto p-4 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Meja {table.nomor}</h1>
          <p className="text-xs text-stone-400">Dibuka {formatWaktu(order.dibuka_pada)}</p>
        </div>
        <Link href="/meja" className="text-sm text-stone-500 hover:text-stone-700">
          &larr; Semua meja
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</p>
      )}

      {unprinted.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          <span>{unprinted.length} item belum tercetak ke dapur.</span>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await printKitchenTicket(unprinted);
              })
            }
            className="font-medium underline disabled:opacity-50"
          >
            Cetak sekarang
          </button>
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
        {activeItems.map((item) => (
          <div key={item.id} className="px-4 py-2.5">
            {voidTarget === item.id ? (
              <VoidRow item={item} onCancel={() => setVoidTarget(null)} onSubmit={submitVoid} />
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex-1 text-sm text-stone-800">
                  {item.qty}x {item.nama_item}
                  {!item.dicetak_dapur && (
                    <span className="ml-2 text-xs text-amber-600">belum dicetak</span>
                  )}
                </span>
                <span className="text-sm font-medium tabular-nums text-stone-600">
                  {formatRupiah(item.qty * item.harga_saat_itu)}
                </span>
                <button
                  onClick={() => setVoidTarget(item.id)}
                  className="text-xs font-medium text-stone-400 hover:text-red-600"
                >
                  Batalkan
                </button>
              </div>
            )}
          </div>
        ))}
        {activeItems.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-stone-400">Belum ada item. Tambah dari menu di bawah.</p>
        )}
      </div>

      {cancelledItems.length > 0 && (
        <details className="text-xs text-stone-400">
          <summary className="cursor-pointer">{cancelledItems.length} item dibatalkan</summary>
          <ul className="mt-1 space-y-1">
            {cancelledItems.map((i) => (
              <li key={i.id} className="line-through">
                {i.qty}x {i.nama_item} — <span className="not-italic no-underline">{i.alasan_batal}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex items-center justify-between rounded-xl bg-stone-800 text-white px-4 py-3">
        <span className="text-sm font-medium">Total</span>
        <span className="text-lg font-semibold tabular-nums">{formatRupiah(total)}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex-1 rounded-xl border border-stone-300 bg-white text-stone-700 py-3 text-sm font-medium"
        >
          {showMenu ? "Tutup menu" : "+ Tambah pesanan"}
        </button>
        <Link
          href={activeItems.length > 0 ? `/meja/${table.id}/bayar` : "#"}
          aria-disabled={activeItems.length === 0}
          className={`flex-1 text-center rounded-xl py-3 text-sm font-medium text-white ${
            activeItems.length === 0 ? "bg-stone-300 pointer-events-none" : "bg-amber-700"
          }`}
        >
          Bayar
        </Link>
      </div>

      {showMenu && (
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
          {grouped.map(({ category, items: catItems }) => (
            <div key={category.id}>
              <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-2">{category.nama}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {catItems.map((m) => (
                  <button
                    key={m.id}
                    disabled={isPending}
                    onClick={() => addItem(m)}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-left text-sm hover:border-amber-400 disabled:opacity-50"
                  >
                    <div className="font-medium text-stone-800">{m.nama}</div>
                    <div className="text-xs text-stone-400 tabular-nums">{formatRupiah(m.harga)}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {uncategorized.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-2">Lainnya</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {uncategorized.map((m) => (
                  <button
                    key={m.id}
                    disabled={isPending}
                    onClick={() => addItem(m)}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-left text-sm hover:border-amber-400 disabled:opacity-50"
                  >
                    <div className="font-medium text-stone-800">{m.nama}</div>
                    <div className="text-xs text-stone-400 tabular-nums">{formatRupiah(m.harga)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function VoidRow({
  item,
  onCancel,
  onSubmit,
}: {
  item: Item;
  onCancel: () => void;
  onSubmit: (itemId: string, alasan: string) => void;
}) {
  const [alasan, setAlasan] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-stone-600 flex-1 min-w-[8rem]">
        Batalkan {item.qty}x {item.nama_item}?
      </span>
      <input
        required
        placeholder="Alasan pembatalan"
        value={alasan}
        onChange={(e) => setAlasan(e.target.value)}
        className="flex-1 min-w-[10rem] rounded-lg border border-stone-300 px-2 py-1 text-sm"
      />
      <button
        onClick={() => alasan.trim() && onSubmit(item.id, alasan)}
        className="rounded-lg bg-red-600 text-white px-3 py-1 text-xs font-medium"
      >
        Batalkan
      </button>
      <button onClick={onCancel} className="text-xs font-medium text-stone-500">
        Batal
      </button>
    </div>
  );
}
