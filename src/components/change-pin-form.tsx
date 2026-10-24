// Hallmark · family: crud-admin · design-system: design.md
"use client";

import { useState, useTransition } from "react";
import { changeOwnPin } from "@/app/actions/staff";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        const { error: pinError } = await changeOwnPin(pin);
        if (pinError) {
          setError(pinError);
          return;
        }
        setSaved(true);
        setPin("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal");
      }
    });
  }

  return (
    <Card as="form" onSubmit={submit} className="p-4 flex flex-wrap items-center gap-3">
      <Input
        required
        placeholder="PIN baru (4-6 digit)"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        className="w-48"
      />
      <Button type="submit" loading={isPending}>
        Ganti PIN
      </Button>
      {saved && <span className="text-sm text-success">PIN diganti.</span>}
      {error && <span className="text-sm text-danger">{error}</span>}
    </Card>
  );
}
