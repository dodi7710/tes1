// Outline icons for the navigation, drawn on a 24px grid at a 1.75 stroke
// so they sit with the rounded Nunito labels beneath them.
import type { SVGProps } from "react";

export type NavIcon = "meja" | "order" | "menu" | "shift" | "laporan" | "pengaturan";

const paths: Record<NavIcon, React.ReactNode> = {
  // A café table seen from the side.
  meja: (
    <>
      <path d="M3 9h18" />
      <path d="M5 9l1.5-4h11L19 9" />
      <path d="M7 9v10M17 9v10M7 14h10" />
    </>
  ),
  // A chat bubble holding a receipt line — orders come in over WhatsApp.
  order: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" />
      <path d="M8 8h8M8 11.5h5" />
    </>
  ),
  // A milk bottle.
  menu: (
    <>
      <path d="M9.5 3h5v3l2 3.5V19a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V9.5l2-3.5z" />
      <path d="M7.5 12h9" />
    </>
  ),
  shift: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  laporan: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16v-5M12 16V6M17 16v-8" />
    </>
  ),
  pengaturan: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
      <circle cx="12" cy="12" r="6.5" />
    </>
  ),
};

export default function NavIconSvg({ name, ...props }: { name: NavIcon } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
