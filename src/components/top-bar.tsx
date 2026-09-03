"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
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
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-6 px-4 py-2.5">
        <span className="font-semibold text-stone-800 whitespace-nowrap">{storeName}</span>
        <nav className="flex gap-1 flex-1 overflow-x-auto">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-amber-100 text-amber-900"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 whitespace-nowrap">
          <span className="text-sm text-stone-500">
            {displayName} <span className="text-stone-300">&middot;</span>{" "}
            {role === "pemilik" ? "Pemilik" : "Kasir"}
          </span>
          <form action={logout}>
            <button className="text-sm font-medium text-stone-500 hover:text-red-600">
              Keluar
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
