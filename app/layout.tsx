import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Galago — Grow while you sleep",
  description:
    "Naira + USDT wallet for real engagement, airtime, virtual numbers and cards. Hold until delivered.",
};

export const viewport: Viewport = {
  themeColor: "#2a1bf7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="min-h-screen antialiased font-[family-name:var(--font-outfit)]">
        {children}
      </body>
    </html>
  );
}
