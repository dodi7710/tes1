import { Receipt } from "./escpos";
import { formatRupiah, formatWaktu } from "@/lib/format";

type TicketItem = { nama_item: string; qty: number };

export function buildKitchenTicket(input: {
  nomorMeja: number;
  items: TicketItem[];
  waktu: string;
}): Uint8Array {
  const r = new Receipt();
  r.center(true).bold(true).line("TIKET DAPUR").bold(false);
  r.center(true).line(`Meja ${input.nomorMeja}`);
  r.center(false).divider();
  r.line(formatWaktu(input.waktu));
  r.feed(1);
  r.bold(true);
  for (const item of input.items) {
    r.line(`${item.qty}x  ${item.nama_item}`);
  }
  r.bold(false);
  r.feed(3);
  r.cut();
  return r.toBytes();
}

type ReceiptItem = { nama_item: string; qty: number; harga_saat_itu: number };

export function buildPaymentReceipt(input: {
  namaWarung: string;
  alamat: string | null;
  nomorMeja: number;
  namaKasir: string;
  items: ReceiptItem[];
  subtotal: number;
  diskon: number;
  total: number;
  metode: "tunai" | "qris";
  jumlahDibayar: number | null;
  kembalian: number | null;
  waktu: string;
}): Uint8Array {
  const r = new Receipt();
  r.center(true).bold(true).line(input.namaWarung).bold(false);
  if (input.alamat) r.line(input.alamat);
  r.divider();
  r.center(false);
  r.row("Meja", String(input.nomorMeja));
  r.row("Kasir", input.namaKasir);
  r.line(formatWaktu(input.waktu));
  r.divider();
  for (const item of input.items) {
    r.line(`${item.qty}x ${item.nama_item}`);
    r.row("", formatRupiah(item.qty * item.harga_saat_itu));
  }
  r.divider();
  r.row("Subtotal", formatRupiah(input.subtotal));
  if (input.diskon > 0) r.row("Diskon", `-${formatRupiah(input.diskon)}`);
  r.bold(true).row("TOTAL", formatRupiah(input.total)).bold(false);
  r.row("Metode", input.metode === "tunai" ? "Tunai" : "QRIS");
  if (input.metode === "tunai") {
    r.row("Dibayar", formatRupiah(input.jumlahDibayar ?? 0));
    r.row("Kembalian", formatRupiah(input.kembalian ?? 0));
  }
  r.feed(1);
  r.center(true).line("Terima kasih!");
  r.feed(3);
  r.cut();
  return r.toBytes();
}
