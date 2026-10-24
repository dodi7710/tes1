import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import ServiceWorkerRegister from "@/components/service-worker-register";
import "./globals.css";

// Rounded and heavy like the lettering on the cow logo.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kasir Susu Moerni",
  description: "Aplikasi kasir warung susu murni",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Susu Moerni",
  },
};

export const viewport: Viewport = {
  themeColor: "#2c72bb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-body">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
