// Hallmark · family: shell · design-system: design.md
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import Badge from "@/components/ui/badge";
import NavIconSvg, { type NavIcon } from "@/components/nav-icons";
import type { Role } from "@/types/database";

type NavLink = { href: string; label: string; icon: NavIcon };

const KASIR_LINKS: NavLink[] = [
  { href: "/meja", label: "Meja", icon: "meja" },
  { href: "/pesanan", label: "Order", icon: "order" },
  { href: "/shift", label: "Shift", icon: "shift" },
  { href: "/pengaturan", label: "Pengaturan", icon: "pengaturan" },
];
const PEMILIK_LINKS: NavLink[] = [
  { href: "/meja", label: "Meja", icon: "meja" },
  { href: "/pesanan", label: "Order", icon: "order" },
  { href: "/menu", label: "Menu", icon: "menu" },
  { href: "/shift", label: "Shift", icon: "shift" },
  { href: "/laporan", label: "Laporan", icon: "laporan" },
  { href: "/pengaturan", label: "Pengaturan", icon: "pengaturan" },
];

/**
 * The logo replaces the store name. From md up the links sit in the top bar;
 * on a phone they could not all fit beside the logo (Chrome on Android cut
 * them off after "Pesanan"), so there they move to a bottom tab bar instead.
 */
export default function TopBar({ displayName, role }: { displayName: string; role: Role }) {
  const pathname = usePathname();
  const links = role === "pemilik" ? PEMILIK_LINKS : KASIR_LINKS;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-rule bg-surface">
        <div className="flex items-center gap-3 md:gap-5 px-3 md:px-4 py-2">
          <Link
            href="/meja"
            aria-label="Susu Moerni — ke halaman Meja"
            className="shrink-0 rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Image src="/logo.png" alt="Susu Moerni" width={44} height={44} priority className="h-11 w-11" />
          </Link>

          <nav className="hidden md:flex gap-1 flex-1 min-w-0" aria-label="Menu utama">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`min-h-10 flex items-center px-3.5 rounded-pill text-sm font-bold whitespace-nowrap transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                  isActive(l.href) ? "bg-accent-2 text-accent" : "text-ink-2 hover:bg-paper-2"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3 whitespace-nowrap ml-auto shrink-0">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              {displayName}
              <Badge tone={role === "pemilik" ? "accent" : "neutral"}>
                {role === "pemilik" ? "Pemilik" : "Kasir"}
              </Badge>
            </span>
            <form action={logout}>
              <button className="min-h-10 px-2 text-sm font-semibold text-ink-2 hover:text-danger transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-input">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav
        aria-label="Menu utama"
        className="md:hidden fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="flex">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <li key={l.href} className="flex-1 min-w-0">
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-semibold leading-tight transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus ${
                    active ? "text-accent" : "text-ink-2"
                  }`}
                >
                  <span
                    className={`flex h-8 w-14 items-center justify-center rounded-pill transition-colors duration-short ease-out ${
                      active ? "bg-accent-2" : ""
                    }`}
                  >
                    <NavIconSvg name={l.icon} />
                  </span>
                  <span className="max-w-full truncate tracking-tight">{l.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
