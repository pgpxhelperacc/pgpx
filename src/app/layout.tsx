import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientAppShell } from "@/components/layout/ClientAppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PGPx Student Portal | IIM Rohtak",
  description:
    "Unified student portal for PGPx IIM Rohtak: track class schedules, deadlines, links, anonymous faculty feedback, anonymous chat, and social events.",
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
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className={`${inter.className} bg-black text-[#ededed] antialiased min-h-screen flex selection:bg-zinc-800 selection:text-white`}>
        <ClientAppShell>{children}</ClientAppShell>
      </body>
    </html>
  );
}
