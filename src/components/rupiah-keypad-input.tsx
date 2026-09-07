// Hallmark · family: transactional-workbench · design-system: design.md
"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/format";
import { inputClasses } from "@/components/ui/input";
import NumericKeypad from "@/components/ui/numeric-keypad";
import Button from "@/components/ui/button";

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
        className={`${inputClasses} text-left ${open ? "border-accent ring-2 ring-accent/30" : ""} ${
          value ? "text-ink" : "text-ink-3"
        }`}
      >
        {value ? formatRupiah(parseInt(value, 10)) : placeholder}
      </button>

      {open && (
        <div className="mt-2 rounded-card border border-rule bg-surface p-2">
          <NumericKeypad
            dense
            onDigit={press}
            onBackspace={backspace}
            backspaceLabel="Hapus"
            slot10={{ label: "Kosongkan", onClick: () => onChange("") }}
            footer={
              <Button fullWidth size="sm" onClick={() => setOpen(false)}>
                Selesai
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
