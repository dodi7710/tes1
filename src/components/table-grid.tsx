"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { openTable } from "@/app/actions/orders";

type Table = { id: string; nomor: number; status: string };

export default function TableGrid({ tables }: { tables: Table[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function open(table: Table) {
    setError(null);
    if (table.status === "terisi") {
      router.push(`/meja/${table.id}`);
      return;
    }
    startTransition(async () => {
      try {
        await openTable(table.id);
        router.push(`/meja/${table.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal membuka meja");
      }
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</p>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {tables.map((t) => (
          <button
            key={t.id}
            disabled={isPending}
            onClick={() => open(t)}
            className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition disabled:opacity-50 ${
              t.status === "terisi"
                ? "border-amber-400 bg-amber-50 text-amber-900"
                : "border-stone-200 bg-white text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            <span className="text-2xl font-semibold">{t.nomor}</span>
            <span className="text-xs font-medium uppercase tracking-wide">
              {t.status === "terisi" ? "Terisi" : "Kosong"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
