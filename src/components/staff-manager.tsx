// Hallmark · family: crud-admin · design-system: design.md
"use client";

import { useState, useTransition } from "react";
import { createKasirAccount, resetKasirPin, setKasirActive } from "@/app/actions/staff";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import Badge from "@/components/ui/badge";

type Staff = { id: string; display_name: string; role: string; status_aktif: boolean };

export default function StaffManager({ staff, myId }: { staff: Staff[]; myId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);

  const [nama, setNama] = useState("");
  const [role, setRole] = useState<"kasir" | "pemilik">("kasir");
  const [pin, setPin] = useState("");
  const [createdPin, setCreatedPin] = useState<{ nama: string; pin: string } | null>(null);

  function run(action: () => Promise<{ error?: string }>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        const { error } = await action();
        if (error) setError(error);
        else onSuccess?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal");
      }
    });
  }

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    setCreatedPin(null);
    run(
      () => createKasirAccount(nama, role, pin),
      () => {
        setCreatedPin({ nama, pin });
        setNama("");
        setPin("");
      },
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-input bg-danger-bg border border-danger/25 text-danger text-sm px-3 py-2">{error}</p>
      )}
      {createdPin && (
        <p className="rounded-input bg-success-bg border border-success/25 text-success text-sm px-3 py-2">
          Akun <b>{createdPin.nama}</b> dibuat. PIN awal:{" "}
          <b className="font-numeric">{createdPin.pin}</b> — sampaikan ke orangnya secara langsung.
        </p>
      )}

      <Card as="ul" className="divide-y divide-rule-2">
        {staff.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`flex-1 text-sm ${s.status_aktif ? "text-ink" : "text-ink-3 line-through"}`}>
              {s.display_name}
            </span>
            <Badge tone={s.role === "pemilik" ? "accent" : "neutral"}>
              {s.role === "pemilik" ? "Pemilik" : "Kasir"}
            </Badge>
            <button
              onClick={() => setResetTarget(resetTarget === s.id ? null : s.id)}
              className="text-xs font-medium text-ink-2 hover:text-accent transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-input px-1"
            >
              Reset PIN
            </button>
            {s.id !== myId && (
              <button
                disabled={isPending}
                onClick={() => run(() => setKasirActive(s.id, !s.status_aktif))}
                className="text-xs font-medium text-ink-2 hover:text-accent disabled:opacity-50 transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-input px-1"
              >
                {s.status_aktif ? "Nonaktifkan" : "Aktifkan"}
              </button>
            )}
            {resetTarget === s.id && (
              <ResetPinInline
                onSubmit={(newPin) =>
                  run(
                    () => resetKasirPin(s.id, newPin),
                    () => setResetTarget(null),
                  )
                }
              />
            )}
          </li>
        ))}
      </Card>

      <Card as="form" onSubmit={submitNew} className="p-4 space-y-3">
        <h3 className="text-sm font-medium text-ink">Tambah akun baru</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-2">
          <Input required placeholder="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
          <Select value={role} onChange={(e) => setRole(e.target.value as "kasir" | "pemilik")}>
            <option value="kasir">Kasir</option>
            <option value="pemilik">Pemilik</option>
          </Select>
          <Input
            required
            placeholder="PIN awal (4-6 digit)"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
          <Button type="submit" loading={isPending}>
            Buat akun
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ResetPinInline({ onSubmit }: { onSubmit: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="PIN baru"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        className="w-28 min-h-9 text-xs"
      />
      <Button size="sm" onClick={() => onSubmit(pin)}>
        Simpan
      </Button>
    </div>
  );
}
