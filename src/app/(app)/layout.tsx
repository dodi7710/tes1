// Hallmark · family: shell · design-system: design.md
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import TopBar from "@/components/top-bar";
import { PrinterProvider } from "@/components/printer-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return (
    <PrinterProvider>
      <div className="min-h-dvh flex flex-col bg-paper">
        <TopBar displayName={profile.display_name} role={profile.role} />
        {/* On a phone the bottom tab bar (~64px + safe area) covers the foot
            of the page, so content gets room to scroll clear of it. */}
        <div className="flex-1 flex flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      </div>
    </PrinterProvider>
  );
}
