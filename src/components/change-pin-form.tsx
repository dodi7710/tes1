"use client";

import { useState, useTransition } from "react";
import { changeOwnPin } from "@/app/actions/staff";

export default function ChangePinForm() {
  const [pin, setPin] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        await changeOwnPin(pin);
        setSaved(true);
        setPin("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal");
      }
    });
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-stone-200 bg-white p-4 flex items-center gap-3">
      <input
        required
        placeholder="PIN baru (4-6 digit)"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm w-48"
      />
      <button
        disabled={isPending}
        className="rounded-lg bg-amber-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        Ganti PIN
      </button>
      {saved && <span className="text-sm text-emerald-600">PIN diganti.</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
