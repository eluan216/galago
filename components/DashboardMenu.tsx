"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  dashboardLanguageNames,
  dashboardLocales,
  translate,
} from "@/lib/dashboard-language";
import { useDashboardLanguage } from "@/components/DashboardLanguageProvider";

const menuLinks = [
  ["/dashboard", "Overview"],
  ["/dashboard/wallet", "Wallet"],
  ["/dashboard/bills", "Bills"],
  ["/dashboard/esim", "eSIM"],
  ["/dashboard/orders", "Orders"],
] as const;

function initials(fullName: string | null, email?: string | null) {
  const source = (fullName || email || "G").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function DashboardMenu({
  fullName,
  email,
}: {
  fullName: string | null;
  email: string | null | undefined;
}) {
  const locale = useDashboardLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [changingLanguage, setChangingLanguage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = (source: string) => translate(locale, source);
  const mark = initials(fullName, email);

  // Close when route changes (user tapped a link)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Outside click + Escape
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const node = rootRef.current;
      if (!node) return;
      const target = event.target as Node | null;
      if (target && !node.contains(target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function changeLanguage(language: string) {
    setChangingLanguage(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: language }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Could not change language.");
      }
      router.refresh();
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Could not change language."
      );
    } finally {
      setChangingLanguage(false);
    }
  }

  return (
    <div ref={rootRef} className="relative z-40">
      <button
        type="button"
        aria-label={t("Menu")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 transition
          border border-[var(--li)]/35 bg-[var(--ink)]/55 text-white
          shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
          hover:border-[var(--li)]/70 hover:bg-[var(--ink)]/75
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--li)]/60
          ${open ? "border-[var(--li)] bg-[var(--ink)] ring-1 ring-[var(--li)]/40" : ""}`}
      >
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-full
            bg-[var(--li)] text-[var(--ink)] text-[11px] font-black tracking-tight"
          aria-hidden
        >
          {mark}
        </span>
        <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-[0.08em] text-white/90">
          {t("Account")}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`w-3 h-3 text-[var(--li)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          {/* Mobile-friendly full-screen dismiss layer under the panel */}
          <button
            type="button"
            aria-label={t("Close menu")}
            className="fixed inset-0 z-40 bg-black/25 sm:bg-transparent"
            onClick={() => setOpen(false)}
          />

          <div
            id={panelId}
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))]
              overflow-hidden rounded-[18px]
              border border-white/10 bg-[#0a0728]
              shadow-[0_18px_40px_rgba(5,2,40,0.55),0_0_0_1px_rgba(200,245,27,0.08)]"
          >
            {/* Header — lime edge, not flat blue-on-blue */}
            <div className="relative px-4 pt-4 pb-3 border-b border-white/8">
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--li)]"
                aria-hidden
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--li)]/90">
                {t("Account")}
              </p>
              <p className="mt-1 text-[14px] font-bold text-white leading-tight">
                {fullName || t("Your Galago account")}
              </p>
              {email && (
                <p className="mt-0.5 truncate text-[12px] text-white/55">
                  {email}
                </p>
              )}
            </div>

            <nav aria-label={t("Menu")} className="p-2">
              {menuLinks.map(([href, label]) => {
                const active =
                  href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold transition
                      ${active
                        ? "bg-[var(--li)]/15 text-[var(--li)]"
                        : "text-white/80 hover:bg-white/6 hover:text-white"
                      }`}
                  >
                    {t(label)}
                    {active && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[var(--li)]"
                        aria-hidden
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 pb-3">
              <label
                htmlFor="dashboard-language"
                className="block px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40"
              >
                {t("Language")}
              </label>
              <select
                id="dashboard-language"
                value={locale}
                disabled={changingLanguage}
                onChange={(event) => void changeLanguage(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#14103a]
                  px-3 py-2.5 text-[13px] font-semibold text-white
                  focus:outline-none focus:border-[var(--li)]/50 disabled:opacity-60"
              >
                {dashboardLocales.map((language) => (
                  <option key={language} value={language}>
                    {dashboardLanguageNames[language]}
                  </option>
                ))}
              </select>
              {error && (
                <p role="alert" className="px-1 pt-2 text-[11px] text-rose-300">
                  {error}
                </p>
              )}
            </div>

            <form
              action="/auth/signout"
              method="post"
              className="border-t border-white/8 p-2"
            >
              <button
                type="submit"
                role="menuitem"
                className="w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold
                  text-rose-300/90 hover:bg-rose-500/10 hover:text-rose-200 transition"
              >
                {t("Sign out")}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
