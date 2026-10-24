// Hallmark · family: auth · design-system: design.md
"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { loginEmailFor, pinToPassword } from "@/lib/auth/login-email";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import NumericKeypad from "@/components/ui/numeric-keypad";

type Staff = { id: string; display_name: string; role: string };

export default function LoginForm({ staff }: { staff: Staff[] }) {
  const [selected, setSelected] = useState<Staff | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
      const email = loginEmailFor(selected.id);
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: pinToPassword(pinValue),
      });
      // Accounts made before pinToPassword stored the raw PIN (always 6 digits,
      // since Supabase refused anything shorter).
      if (signInError && pinValue.length >= 6) {
        ({ error: signInError } = await supabase.auth.signInWithPassword({ email, password: pinValue }));
      }
      if (signInError) {
        setError("PIN salah. Coba lagi.");
        setPin("");
        return;
      }
      // A client-side router.replace() here raced the session cookie the
      // browser client just set — the very next Server Component render
      // sometimes ran before the cookie was visible to it, rendering a
      // blank page until a manual reload. A full navigation guarantees the
      // next request to the server carries the fresh cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/meja";
    });
  }

  if (!selected) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-paper p-6">
        <div className="w-full max-w-2xl">
          <h1 className="font-display text-2xl font-semibold text-ink mb-1">Kasir Warung Susu</h1>
          <p className="text-ink-2 mb-8">Pilih nama Anda untuk masuk</p>
          {staff.length === 0 ? (
            <p className="text-ink-2">Belum ada akun staff aktif. Hubungi pemilik untuk dibuatkan akun.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {staff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-card"
                >
                  <Card className="flex flex-col items-center gap-2 p-6 shadow-sm hover:border-accent/50 hover:shadow-md transition duration-short ease-out">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-2 text-accent text-xl font-semibold">
                      {s.display_name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="font-medium text-ink">{s.display_name}</span>
                    <Badge tone={s.role === "pemilik" ? "accent" : "neutral"}>
                      {s.role === "pemilik" ? "Pemilik" : "Kasir"}
                    </Badge>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-paper p-6">
      <div className="w-full max-w-xs text-center">
        <button
          onClick={reset}
          className="text-sm text-ink-2 hover:text-ink mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-input px-1"
        >
          &larr; Ganti pengguna
        </button>
        <div className="mb-6">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-2 text-accent text-2xl font-semibold mb-2">
            {selected.display_name.slice(0, 1).toUpperCase()}
          </span>
          <p className="font-medium text-ink">{selected.display_name}</p>
          <p className="text-sm text-ink-3">Masukkan PIN</p>
        </div>

        <div className="flex justify-center gap-3 mb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={`h-3 w-3 rounded-full ${i < pin.length ? "bg-accent" : "bg-rule"}`} />
          ))}
        </div>
        <p className="h-5 text-sm text-danger mb-4">{error}</p>

        <NumericKeypad
          onDigit={pickDigit}
          onBackspace={backspace}
          disabled={isPending}
          backspaceLabel="Hapus"
          slot10={{ label: "Masuk", onClick: () => submit(pin), tone: "primary", disabled: isPending }}
        />
      </div>
    </main>
  );
}
