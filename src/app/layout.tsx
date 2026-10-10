import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientAppShell } from "@/components/layout/ClientAppShell";

export const metadata: Metadata = {
  title: "PGPx Student Portal | IIM Rohtak",
  description:
    "Unified mobile-first student portal for PGPx IIM Rohtak: track class schedules, deadlines, links, anonymous faculty feedback, anonymous chat, and social events.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PGPx IIMR",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-[#ededed] antialiased min-h-screen flex">
        <ClientAppShell>{children}</ClientAppShell>
      </body>
    </html>
  );
}
