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
  initial: { nama_warung: string; alamat: string | null };
}) {
  const [nama, setNama] = useState(initial.nama_warung);
  const [alamat, setAlamat] = useState(initial.alamat ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        await updateStoreSettings({ namaWarung: nama, alamat });
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
