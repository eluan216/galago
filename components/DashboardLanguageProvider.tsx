"use client";

import { createContext, useContext } from "react";
import { DashboardLocale } from "@/lib/dashboard-language";

const DashboardLanguageContext = createContext<DashboardLocale>("en");

export function DashboardLanguageProvider({
  locale,
  children,
}: {
  locale: DashboardLocale;
  children: React.ReactNode;
}) {
  return (
    <DashboardLanguageContext.Provider value={locale}>
      {children}
    </DashboardLanguageContext.Provider>
  );
}

export function useDashboardLanguage() {
  return useContext(DashboardLanguageContext);
}
