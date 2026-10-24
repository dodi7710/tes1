import { formatRupiah } from "@/lib/format";

/**
 * Normalizes an Indonesian WhatsApp number to the international form wa.me
 * expects (WA-1): "0851-8506-6599", "+62 851…", "62851…" and "851…" all
 * become "6285185066599". Returns null when it can't be a mobile number.
 */
export function normalizeWa(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  if (!/^628\d{7,11}$/.test(digits)) return null;
  return digits;
}

/** "6285185066599" → "0851-8506-6599", for showing the number back to people. */
export function formatWa(normalized: string): string {
  const local = "0" + normalized.slice(2);
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

export const METODE_LABEL: Record<string, string> = {
  qris: "QRIS",
  transfer: "Transfer",
  tunai: "COD (tunai)",
};

export type WaMessageInput = {
  kode: string;
  dibukaPada: string;
  namaPelanggan: string | null;
  waktuAmbil: string | null;
  items: { nama_item: string; qty: number; harga_saat_itu: number }[];
  namaToko: string;
  alamatAmbil: string | null;
  infoPembayaran: string | null;
  /** Payment method once the order is marked paid, else null. */
  metodeLunas: string | null;
};

/** WA-3: the order summary pre-filled into WhatsApp for the admin to send. */
export function buildWaMessage(input: WaMessageInput): string {
  const tanggal = new Date(input.dibukaPada).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const sapaan = input.namaPelanggan ? `Halo Kak ${input.namaPelanggan}` : "Halo Kak";
  const total = input.items.reduce((s, i) => s + i.qty * i.harga_saat_itu, 0);

  const lines = [
    `${sapaan}, ini rincian pesanannya ya 🙏`,
    `Pesanan ${input.kode} · ${tanggal}`,
    "",
    ...input.items.map((i) => `${i.nama_item} x${i.qty} = ${formatRupiah(i.qty * i.harga_saat_itu)}`),
    "------------------------",
    `Total: ${formatRupiah(total)}`,
    "",
  ];

  if (input.metodeLunas) {
    lines.push(`Status: sudah dibayar (${METODE_LABEL[input.metodeLunas] ?? input.metodeLunas}) ✅`);
  } else if (input.infoPembayaran?.trim()) {
    lines.push(`Pembayaran: ${input.infoPembayaran.trim()}`);
  }
  if (input.waktuAmbil?.trim()) lines.push(`Waktu ambil: ${input.waktuAmbil.trim()}`);
  if (input.alamatAmbil?.trim()) lines.push(`Ambil di: ${input.alamatAmbil.trim()}`);
  lines.push(`Terima kasih, ${input.namaToko} 🥛`);

  return lines.join("\n");
}

export function waLink(normalizedNumber: string, text: string): string {
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(text)}`;
}

export type WaStatus = "belum_bayar" | "lunas" | "diambil" | "batal";

/** WA-5: one display status derived from orders.status + diambil_pada. */
export function waStatus(order: { status: string; diambil_pada: string | null }): WaStatus {
  if (order.status === "dibatalkan") return "batal";
  if (order.status === "lunas") return order.diambil_pada ? "diambil" : "lunas";
  return "belum_bayar";
}

export const WA_STATUS_LABEL: Record<WaStatus, string> = {
  belum_bayar: "Menunggu bayar",
  lunas: "Lunas, belum diambil",
  diambil: "Selesai diambil",
  batal: "Batal",
};

export const WA_STATUS_TONE = {
  belum_bayar: "warning",
  lunas: "accent",
  diambil: "success",
  batal: "neutral",
} as const satisfies Record<WaStatus, string>;
