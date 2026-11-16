import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Galago — Grow while you sleep",
  description: "Nigerian digital marketplace. Unified wallet for social growth, VTU, virtual numbers, cards, eSIM & crypto funding.",
  themeColor: "#0B0F14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-night text-moon antialiased">
        {children}
      </body>
    </html>
  );
}