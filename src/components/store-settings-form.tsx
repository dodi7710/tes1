"use client";

import { useState, useTransition } from "react";
import { updateStoreSettings } from "@/app/actions/settings";

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
    <form onSubmit={submit} className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
      <label className="block">
        <span className="text-xs font-medium text-stone-500">Nama warung</span>
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-stone-500">Alamat</span>
        <textarea
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          disabled={isPending}
          className="rounded-lg bg-amber-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Simpan
        </button>
        {saved && <span className="text-sm text-emerald-600">Tersimpan.</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
