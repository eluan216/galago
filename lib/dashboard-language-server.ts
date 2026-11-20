import { cookies } from "next/headers";
import {
  DashboardLocale,
  isDashboardLocale,
} from "@/lib/dashboard-language";

export async function getDashboardLocale(): Promise<DashboardLocale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("galago-locale")?.value;
  return isDashboardLocale(locale) ? locale : "en";
}
