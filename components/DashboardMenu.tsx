"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export function DashboardMenu({
  fullName,
  email,
}: {
  fullName: string | null;
  email: string | null | undefined;
}) {
  const locale = useDashboardLanguage();
  const router = useRouter();
  const [changingLanguage, setChangingLanguage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = (source: string) => translate(locale, source);

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
    <details className="relative">
      <summary
        aria-label={t("Menu")}
        className="list-none cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-white/10 [&::-webkit-details-marker]:hidden"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="w-4 h-4"
        >
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <span className="hidden sm:inline">{t("Menu")}</span>
      </summary>
      <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/15 bg-[var(--bl)] p-3 shadow-2xl">
        <div className="px-2 py-2 border-b border-white/15">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/55">
            {t("Important details")}
          </p>
          <p className="mt-1 text-[13px] font-bold text-white">
            {fullName || t("Your Galago account")}
          </p>
          {email && (
            <p className="mt-0.5 truncate text-[11px] text-white/65">{email}</p>
          )}
        </div>

        <nav aria-label={t("Menu")} className="py-2">
          {menuLinks.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="block rounded-lg px-2 py-2 text-[12px] font-semibold text-white/80 hover:bg-white/10 hover:text-white"
            >
              {t(label)}
            </Link>
          ))}
        </nav>

        <label
          htmlFor="dashboard-language"
          className="block px-2 pt-2 text-[10px] font-bold uppercase tracking-wide text-white/55"
        >
          {t("Language")}
        </label>
        <select
          id="dashboard-language"
          value={locale}
          disabled={changingLanguage}
          onChange={(event) => void changeLanguage(event.target.value)}
          className="mt-1 w-full rounded-lg border border-white/20 bg-white px-2.5 py-2 text-[12px] font-semibold text-[var(--ink)] disabled:opacity-60"
        >
          {dashboardLocales.map((language) => (
            <option key={language} value={language}>
              {dashboardLanguageNames[language]}
            </option>
          ))}
        </select>
        {error && (
          <p role="alert" className="px-2 pt-2 text-[11px] text-rose-200">
            {error}
          </p>
        )}

        <form action="/auth/signout" method="post" className="mt-2 border-t border-white/15 pt-2">
          <button
            type="submit"
            className="w-full rounded-lg px-2 py-2 text-left text-[12px] font-semibold text-white/80 hover:bg-white/10 hover:text-[var(--li)]"
          >
            {t("Sign out")}
          </button>
        </form>
      </div>
    </details>
  );
}
