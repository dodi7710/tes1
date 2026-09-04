"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/format";

/**
 * Numeric amount entry via an on-screen keypad instead of the device's own
 * keyboard. Native numeric keyboards vary a lot across Android tablets, and
 * some submit the surrounding form early when their "done"/checkmark key is
 * tapped mid-entry — which was silently saving tiny wrong amounts (e.g. a
 * modal awal of "Rp 22" instead of the intended larger number). This sidesteps
 * that whole class of bug: there is no native text input to submit early.
 */
export default function RupiahKeypadInput({
  value,
  onChange,
  placeholder,
  autoOpen = false,
}: {
  value: string;
  onChange: (digits: string) => void;
  placeholder: string;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);

  function press(d: string) {
    if (value.length >= 12) return;
    onChange(value + d);
  }
  function backspace() {
    onChange(value.slice(0, -1));
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-left ${
          open ? "border-amber-400 ring-1 ring-amber-400" : "border-stone-300"
        } ${value ? "text-stone-800" : "text-stone-400"}`}
      >
        {value ? formatRupiah(parseInt(value, 10)) : placeholder}
      </button>

      {open && (
        <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl border border-stone-200 bg-white p-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => press(d)}
              className="h-12 rounded-lg bg-stone-50 border border-stone-200 text-lg font-medium text-stone-800 active:bg-amber-50"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange("")}
            className="h-12 rounded-lg bg-stone-50 border border-stone-200 text-xs font-medium text-stone-500 active:bg-amber-50"
          >
            Kosongkan
          </button>
          <button
            type="button"
            onClick={() => press("0")}
            className="h-12 rounded-lg bg-stone-50 border border-stone-200 text-lg font-medium text-stone-800 active:bg-amber-50"
          >
            0
          </button>
          <button
            type="button"
            onClick={backspace}
            className="h-12 rounded-lg bg-stone-50 border border-stone-200 text-xs font-medium text-stone-500 active:bg-amber-50"
          >
            Hapus
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="col-span-3 h-10 rounded-lg bg-amber-700 text-white text-sm font-medium"
          >
            Selesai
          </button>
        </div>
      )}
    </div>
  );
}
