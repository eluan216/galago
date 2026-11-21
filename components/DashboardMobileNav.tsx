"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />
    ),
  },
  {
    href: "/dashboard/wallet",
    label: "Wallet",
    icon: (
      <>
        <path d="M4 7.5A2.5 2.5 0 016.5 5H19v14H6.5A2.5 2.5 0 014 16.5z" />
        <path d="M19 9h-4a2 2 0 000 4h4" />
      </>
    ),
  },
  {
    href: "/dashboard/bills",
    label: "Bills",
    icon: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
  },
  {
    href: "/dashboard/esim",
    label: "eSIM",
    icon: (
      <>
        <path d="M6 3h8l5 5v13H6z" />
        <rect x="9" y="12" width="7" height="6" rx="1.2" />
      </>
    ),
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    icon: (
      <>
        <path d="M3 11v3l12 5V6z" />
        <path d="M15 9.5a3 3 0 010 6" />
      </>
    ),
  },
] as const;

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="dash-mobile-nav md:hidden fixed left-1/2 -translate-x-1/2 bottom-[max(12px,env(safe-area-inset-bottom))] w-[min(480px,calc(100%-24px))] z-40 flex p-1.5 rounded-[24px]"
      aria-label="Main"
    >
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[18px] text-[11px] font-semibold min-h-[54px] transition ${
              active
                ? "bg-[var(--li)] text-[var(--ink)]"
                : "text-white/85 hover:text-white"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-[22px] h-[22px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
