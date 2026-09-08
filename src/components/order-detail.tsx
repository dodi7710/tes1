// Hallmark · family: transactional-workbench · design-system: design.md
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addOrderItem, cancelOrder, markItemsPrinted, openTable, voidOrderItem } from "@/app/actions/orders";
import { usePrinter } from "@/components/printer-provider";
import { buildKitchenTicket } from "@/lib/print/templates";
import { formatRupiah, formatWaktu } from "@/lib/format";
import Card from "@/components/ui/card";
import Button, { buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import ConfirmDisclosure from "@/components/ui/confirm-disclosure";
import Link from "next/link";

type Item = {
  id: string;
  nama_item: string;
  harga_saat_itu: number;
  qty: number;
  status: string;
  alasan_batal: string | null;
  dicetak_dapur: boolean;
  catatan: string | null;
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
  const [pendingMenuItem, setPendingMenuItem] = useState<MenuItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const printer = usePrinter();
  const router = useRouter();

  if (!order) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-ink-2">Meja {table.nomor} belum ada pesanan aktif.</p>
          <Button
            loading={isPending}
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
          >
            Buka Meja
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
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
      items: ticketItems.map((i) => ({ nama_item: i.nama_item, qty: i.qty, catatan: i.catatan })),
      waktu: new Date().toISOString(),
    });
    const result = await printer.print(bytes);
    if (result.ok) {
      await markItemsPrinted(ticketItems.map((i) => i.id));
      router.refresh();
    }
    return result;
  }

  function confirmAddItem(menuItem: MenuItem, qty: number, catatan: string) {
    setError(null);
    startTransition(async () => {
      try {
        // Doesn't print immediately — kasir adds everything for this round
        // first, then sends it to the kitchen as one ticket via "Cetak
        // Pesanan" once, instead of one printout per tap.
        await addOrderItem(order!.id, menuItem.id, qty, catatan || null);
        setPendingMenuItem(null);
        router.refresh();
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

  function submitCancelOrder(alasan: string) {
    setError(null);
    startTransition(async () => {
      try {
        await cancelOrder(order!.id, alasan);
        router.replace("/meja");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal membatalkan meja");
      }
    });
  }

  const grouped = categories.map((c) => ({ category: c, items: menuItems.filter((m) => m.kategori_id === c.id) }));
  const uncategorized = menuItems.filter((m) => !m.kategori_id);

  return (
    <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-4 gap-4">
      <PageHeader
        title={`Meja ${table.nomor}`}
        subtitle={`Dibuka ${formatWaktu(order.dibuka_pada)}`}
        actions={
          <button
            onClick={() => setCancelling(true)}
            className="text-xs font-medium text-ink-3 hover:text-danger transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-input px-1"
          >
            Batalkan meja
          </button>
        }
        back={{ href: "/meja", label: "Semua meja" }}
      />

      {error && (
        <p className="rounded-input bg-danger-bg border border-danger/25 text-danger text-sm px-3 py-2">{error}</p>
      )}

      {cancelling && (
        <ConfirmDisclosure
          tone="danger"
          submitLabel="Batalkan Meja"
          reasonPlaceholder="Alasan pembatalan meja"
          prompt={
            activeItems.length > 0
              ? "Membatalkan meja ini akan menghapus seluruh pesanan tanpa pembayaran. Item yang sudah dicetak ke dapur tetap perlu dikomunikasikan pembatalannya secara manual."
              : "Meja ini akan dilepas kembali menjadi kosong tanpa pesanan."
          }
          onCancel={() => setCancelling(false)}
          onSubmit={submitCancelOrder}
        />
      )}

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Scrolling zone — item list, void/cancel disclosures, menu picker */}
        <div className="flex-1 min-w-0 space-y-4">
          <Card className="divide-y divide-rule-2">
            {activeItems.map((item) => (
              <div key={item.id} className="px-4 py-2.5">
                {voidTarget === item.id ? (
                  <ConfirmDisclosure
                    compact
                    submitLabel="Batalkan"
                    reasonPlaceholder="Alasan pembatalan"
                    prompt={`Batalkan ${item.qty}x ${item.nama_item}?`}
                    onCancel={() => setVoidTarget(null)}
                    onSubmit={(alasan) => submitVoid(item.id, alasan)}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-ink">
                        {item.qty}x {item.nama_item}
                        {!item.dicetak_dapur && (
                          <span className="ml-2 text-xs text-warning">belum dicetak</span>
                        )}
                      </span>
                      {item.catatan && <p className="text-xs text-ink-3 truncate">Catatan: {item.catatan}</p>}
                    </div>
                    <span className="font-numeric text-sm font-medium text-ink-2">
                      {formatRupiah(item.qty * item.harga_saat_itu)}
                    </span>
                    <button
                      onClick={() => setVoidTarget(item.id)}
                      className="text-xs font-medium text-ink-3 hover:text-danger transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-input px-1"
                    >
                      Batalkan
                    </button>
                  </div>
                )}
              </div>
            ))}
            {activeItems.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink-3">Belum ada item. Tambah dari menu di bawah.</p>
            )}
          </Card>

          {cancelledItems.length > 0 && (
            <details className="text-xs text-ink-3">
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

          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowMenu((v) => !v)}
          >
            {showMenu ? "Tutup menu" : "+ Tambah pesanan"}
          </Button>

          {pendingMenuItem && (
            <AddItemPanel
              menuItem={pendingMenuItem}
              isPending={isPending}
              onCancel={() => setPendingMenuItem(null)}
              onConfirm={(qty, catatan) => confirmAddItem(pendingMenuItem, qty, catatan)}
            />
          )}

          {showMenu && !pendingMenuItem && (
            <Card className="space-y-4 p-4">
              {grouped.map(({ category, items: catItems }) => (
                <div key={category.id}>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-ink-3 mb-2">{category.nama}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {catItems.map((m) => (
                      <MenuTile key={m.id} item={m} disabled={isPending} onSelect={() => setPendingMenuItem(m)} />
                    ))}
                  </div>
                </div>
              ))}
              {uncategorized.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-ink-3 mb-2">Lainnya</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {uncategorized.map((m) => (
                      <MenuTile key={m.id} item={m} disabled={isPending} onSelect={() => setPendingMenuItem(m)} />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Persistent rail — kitchen ticket, total, primary CTA */}
        <aside className="md:w-80 shrink-0 space-y-3 md:sticky md:top-20 md:self-start">
          {unprinted.length > 0 && (
            <Button
              variant="secondary"
              fullWidth
              size="lg"
              loading={isPending}
              onClick={() =>
                startTransition(async () => {
                  await printKitchenTicket(unprinted);
                })
              }
            >
              🖨 Cetak Pesanan untuk Dapur ({unprinted.length} item)
            </Button>
          )}

          <div className="flex items-center justify-between rounded-card bg-ink text-paper px-4 py-3">
            <span className="text-sm font-medium">Total</span>
            <span className="font-numeric text-lg font-semibold">{formatRupiah(total)}</span>
          </div>

          <Link
            href={activeItems.length > 0 ? `/meja/${table.id}/bayar` : "#"}
            aria-disabled={activeItems.length === 0}
            className={buttonClasses({
              size: "lg",
              fullWidth: true,
              className: activeItems.length === 0 ? "opacity-50 pointer-events-none" : "",
            })}
          >
            Bayar
          </Link>
        </aside>
      </div>
    </main>
  );
}

function MenuTile({
  item,
  disabled,
  onSelect,
}: {
  item: MenuItem;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onSelect}
      className="rounded-input border border-rule px-3 py-2 text-left text-sm hover:border-accent/50 transition-colors duration-short ease-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <div className="font-medium text-ink">{item.nama}</div>
      <div className="font-numeric text-xs text-ink-3">{formatRupiah(item.harga)}</div>
    </button>
  );
}

function AddItemPanel({
  menuItem,
  isPending,
  onCancel,
  onConfirm,
}: {
  menuItem: MenuItem;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (qty: number, catatan: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [catatan, setCatatan] = useState("");

  return (
    <Card className="bg-accent-2/40 border-accent/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-ink">{menuItem.nama}</p>
          <p className="font-numeric text-xs text-ink-2">{formatRupiah(menuItem.harga)} / item</p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs font-medium text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-input px-1"
        >
          Batal
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-ink-2">Qty</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-10 w-10 rounded-input border border-rule bg-surface text-lg font-medium text-ink transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            −
          </button>
          <span className="font-numeric w-8 text-center font-medium">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="h-10 w-10 rounded-input border border-rule bg-surface text-lg font-medium text-ink transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <span className="text-xs font-medium text-ink-2">Catatan untuk dapur (opsional)</span>
        <Input
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="mis. susu hangat, gula sedikit, tanpa es"
          className="mt-1"
        />
      </div>

      <Button fullWidth loading={isPending} onClick={() => onConfirm(qty, catatan)}>
        Tambah {qty}x ke pesanan — {formatRupiah(qty * menuItem.harga)}
      </Button>
    </Card>
  );
}
