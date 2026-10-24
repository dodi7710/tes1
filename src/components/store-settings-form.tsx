// Hallmark · family: crud-admin · design-system: design.md
"use client";

import { useState, useTransition } from "react";
import { updateStoreSettings } from "@/app/actions/settings";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export default function StoreSettingsForm({
  initial,
}: {
  initial: {
    nama_warung: string;
    alamat: string | null;
    alamat_ambil: string | null;
    info_pembayaran_wa: string | null;
  };
}) {
  const [nama, setNama] = useState(initial.nama_warung);
  const [alamat, setAlamat] = useState(initial.alamat ?? "");
  const [alamatAmbil, setAlamatAmbil] = useState(initial.alamat_ambil ?? "");
  const [infoPembayaran, setInfoPembayaran] = useState(initial.info_pembayaran_wa ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        await updateStoreSettings({ namaWarung: nama, alamat, alamatAmbil, infoPembayaranWa: infoPembayaran });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan");
      }
    });
  }

  return (
    <Card as="form" onSubmit={submit} className="p-4 space-y-3">
      <label className="block">
        <span className="text-xs font-medium text-ink-2">Nama warung</span>
        <Input value={nama} onChange={(e) => setNama(e.target.value)} required className="mt-1" />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-ink-2">Alamat</span>
        <Textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} rows={2} className="mt-1" />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-ink-2">Alamat ambil pesanan WA</span>
        <Input
          value={alamatAmbil}
          onChange={(e) => setAlamatAmbil(e.target.value)}
          placeholder="mis. Jl. Pemuda 37 (Toko Fedora Komputer), Blora"
          className="mt-1"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-ink-2">Info pembayaran di pesan WA</span>
        <Textarea
          value={infoPembayaran}
          onChange={(e) => setInfoPembayaran(e.target.value)}
          rows={2}
          placeholder="mis. QRIS / transfer BCA 1234567890 a.n. ... / COD saat ambil"
          className="mt-1"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          Simpan
        </Button>
        {saved && <span className="text-sm text-success">Tersimpan.</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </Card>
  );
}
