"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginEmailFor } from "@/lib/auth/login-email";

type Staff = { id: string; display_name: string; role: string };

export default function LoginForm({ staff }: { staff: Staff[] }) {
  const [selected, setSelected] = useState<Staff | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function pickDigit(d: string) {
    setError(null);
    if (pin.length >= 6) return;
    setPin(pin + d);
  }

  function backspace() {
    setError(null);
    setPin(pin.slice(0, -1));
  }

  function reset() {
    setSelected(null);
    setPin("");
    setError(null);
  }

  function submit(pinValue: string) {
    if (!selected || pinValue.length < 4) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmailFor(selected.id),
        password: pinValue,
      });
      if (signInError) {
        setError("PIN salah. Coba lagi.");
        setPin("");
        return;
      }
      router.replace("/meja");
      router.refresh();
    });
  }

  if (!selected) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-stone-50 p-6">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-semibold text-stone-800 mb-1">Kasir Warung Susu</h1>
          <p className="text-stone-500 mb-8">Pilih nama Anda untuk masuk</p>
          {staff.length === 0 ? (
            <p className="text-stone-500">
              Belum ada akun staff aktif. Hubungi pemilik untuk dibuatkan akun.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {staff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-amber-400 hover:shadow-md transition"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xl font-semibold">
                    {s.display_name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="font-medium text-stone-800">{s.display_name}</span>
                  <span className="text-xs uppercase tracking-wide text-stone-400">
                    {s.role === "pemilik" ? "Pemilik" : "Kasir"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-stone-50 p-6">
      <div className="w-full max-w-xs text-center">
        <button onClick={reset} className="text-sm text-stone-500 mb-4">
          &larr; Ganti pengguna
        </button>
        <div className="mb-6">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-2xl font-semibold mb-2">
            {selected.display_name.slice(0, 1).toUpperCase()}
          </span>
          <p className="font-medium text-stone-800">{selected.display_name}</p>
          <p className="text-sm text-stone-400">Masukkan PIN</p>
        </div>

        <div className="flex justify-center gap-3 mb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full ${i < pin.length ? "bg-amber-600" : "bg-stone-200"}`}
            />
          ))}
        </div>
        <p className="h-5 text-sm text-red-600 mb-4">{error}</p>

        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              disabled={isPending}
              onClick={() => pickDigit(d)}
              className="h-16 rounded-xl bg-white border border-stone-200 text-xl font-medium text-stone-800 active:bg-amber-50 disabled:opacity-50"
            >
              {d}
            </button>
          ))}
          <button
            disabled={isPending}
            onClick={() => submit(pin)}
            className="h-16 rounded-xl bg-amber-700 text-white text-sm font-medium active:bg-amber-800 disabled:opacity-50"
          >
            Masuk
          </button>
          <button
            disabled={isPending}
            onClick={() => pickDigit("0")}
            className="h-16 rounded-xl bg-white border border-stone-200 text-xl font-medium text-stone-800 active:bg-amber-50 disabled:opacity-50"
          >
            0
          </button>
          <button
            disabled={isPending}
            onClick={backspace}
            className="h-16 rounded-xl bg-white border border-stone-200 text-sm font-medium text-stone-600 active:bg-amber-50 disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
      </div>
    </main>
  );
}
