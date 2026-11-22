import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Galago — Digital services, one wallet",
  description:
    "Manage supported digital services, Nigerian bill payments, eSIM plans and wallet transactions in one account. Service and payment availability varies.",
};

export const viewport: Viewport = {
  themeColor: "#2a1bf7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={display.variable}>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
