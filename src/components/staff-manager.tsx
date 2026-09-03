"use client";

import { useState, useTransition } from "react";
import { createKasirAccount, resetKasirPin, setKasirActive } from "@/app/actions/staff";

type Staff = { id: string; display_name: string; role: string; status_aktif: boolean };

export default function StaffManager({ staff, myId }: { staff: Staff[]; myId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);

  const [nama, setNama] = useState("");
  const [role, setRole] = useState<"kasir" | "pemilik">("kasir");
  const [pin, setPin] = useState("");
  const [createdPin, setCreatedPin] = useState<{ nama: string; pin: string } | null>(null);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal");
      }
    });
  }

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      await createKasirAccount(nama, role, pin);
      setCreatedPin({ nama, pin });
      setNama("");
      setPin("");
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</p>
      )}
      {createdPin && (
        <p className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2">
          Akun <b>{createdPin.nama}</b> dibuat. PIN awal: <b className="tabular-nums">{createdPin.pin}</b> — sampaikan ke orangnya secara langsung.
        </p>
      )}

      <ul className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
        {staff.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`flex-1 text-sm ${s.status_aktif ? "text-stone-800" : "text-stone-400 line-through"}`}>
              {s.display_name}
            </span>
            <span className="text-xs uppercase tracking-wide text-stone-400">
              {s.role === "pemilik" ? "Pemilik" : "Kasir"}
            </span>
            <button
              onClick={() => setResetTarget(resetTarget === s.id ? null : s.id)}
              className="text-xs font-medium text-stone-500 hover:text-amber-700"
            >
              Reset PIN
            </button>
            {s.id !== myId && (
              <button
                disabled={isPending}
                onClick={() => run(() => setKasirActive(s.id, !s.status_aktif))}
                className="text-xs font-medium text-stone-500 hover:text-amber-700 disabled:opacity-50"
              >
                {s.status_aktif ? "Nonaktifkan" : "Aktifkan"}
              </button>
            )}
            {resetTarget === s.id && (
              <ResetPinInline
                onSubmit={(newPin) =>
                  run(async () => {
                    await resetKasirPin(s.id, newPin);
                    setResetTarget(null);
                  })
                }
              />
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={submitNew} className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
        <h3 className="text-sm font-medium text-stone-800">Tambah akun baru</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-2">
          <input
            required
            placeholder="Nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "kasir" | "pemilik")}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="kasir">Kasir</option>
            <option value="pemilik">Pemilik</option>
          </select>
          <input
            required
            placeholder="PIN awal (4-6 digit)"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            disabled={isPending}
            className="rounded-lg bg-amber-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Buat akun
          </button>
        </div>
      </form>
    </div>
  );
}

function ResetPinInline({ onSubmit }: { onSubmit: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        placeholder="PIN baru"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        className="w-28 rounded-lg border border-stone-300 px-2 py-1 text-xs"
      />
      <button
        onClick={() => onSubmit(pin)}
        className="rounded-lg bg-amber-700 text-white px-3 py-1 text-xs font-medium"
      >
        Simpan
      </button>
    </div>
  );
}
