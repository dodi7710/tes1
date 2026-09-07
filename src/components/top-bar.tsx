// Hallmark · family: shell · design-system: design.md
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import PrinterStatusButton from "@/components/printer-status-button";
import Badge from "@/components/ui/badge";
import type { Role } from "@/types/database";

const KASIR_LINKS = [{ href: "/meja", label: "Meja" }, { href: "/shift", label: "Shift" }];
const PEMILIK_LINKS = [
  { href: "/meja", label: "Meja" },
  { href: "/menu", label: "Menu" },
  { href: "/shift", label: "Shift" },
  { href: "/laporan", label: "Laporan" },
  { href: "/pengaturan", label: "Pengaturan" },
];

export default function TopBar({
  displayName,
  role,
  storeName,
}: {
  displayName: string;
  role: Role;
  storeName: string;
}) {
  const pathname = usePathname();
  const links = role === "pemilik" ? PEMILIK_LINKS : KASIR_LINKS;

  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-surface/95 backdrop-blur">
      <div className="flex items-center gap-3 sm:gap-6 px-3 sm:px-4 py-2.5">
        <span className="font-display font-semibold text-ink whitespace-nowrap shrink-0">{storeName}</span>
        <nav className="flex gap-1 flex-1 min-w-0 overflow-x-auto">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`min-h-10 flex items-center px-3 rounded-input text-sm font-medium whitespace-nowrap transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                  active ? "bg-accent-2 text-accent" : "text-ink-2 hover:bg-paper-2"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-3 whitespace-nowrap shrink-0">
          <PrinterStatusButton />
          <span className="hidden sm:flex items-center gap-1.5 text-sm text-ink-2">
            {displayName}
            <span className="text-ink-3">&middot;</span>
            <Badge tone={role === "pemilik" ? "accent" : "neutral"}>
              {role === "pemilik" ? "Pemilik" : "Kasir"}
            </Badge>
          </span>
          <form action={logout}>
            <button className="min-h-10 px-2 text-sm font-medium text-ink-2 hover:text-danger transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-input">
              Keluar
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
