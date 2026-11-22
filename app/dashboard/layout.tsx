import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GalagoMark } from "@/components/logo";
import { DashboardLanguageProvider } from "@/components/DashboardLanguageProvider";
import { DashboardMenu } from "@/components/DashboardMenu";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { getDashboardLocale } from "@/lib/dashboard-language-server";
import { translate } from "@/lib/dashboard-language";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-[var(--bl)] text-white">
        <div className="glass-panel max-w-md p-7 text-center">
          <h1 className="text-xl font-black uppercase">Platform setup required</h1>
          <p className="text-white/70 text-sm mt-3">
            Supabase environment variables are missing. Add the values from{" "}
            <code>.env.example</code>, then restart the app.
          </p>
        </div>
      </main>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }
  const locale = await getDashboardLocale();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <DashboardLanguageProvider locale={locale}>
      <div className="dash-shell min-h-screen flex flex-col text-white">
        <header className="sticky top-0 z-50 px-4 sm:px-6 py-3">
          <div className="max-w-[1080px] mx-auto flex items-center gap-3">
            <Link
              href="/dashboard"
              className="brand-lockup group shrink-0"
              aria-label="Galago dashboard"
            >
              <span className="brand-mark">
                <GalagoMark className="w-[26px] h-[26px]" />
              </span>
              <span className="brand-word hidden sm:inline font-display">
                Galago
              </span>
            </Link>

            <nav
              className="hidden md:flex items-center gap-1 p-1 rounded-full glass-nav ml-2"
              aria-label="Main"
            >
              {[
                ["/dashboard", "Overview"],
                ["/dashboard/wallet", "Wallet"],
                ["/dashboard/bills", "Bills"],
                ["/dashboard/esim", "eSIM"],
                ["/dashboard/orders", "Orders"],
                ["/dashboard/telegram", "Telegram"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3.5 py-2.5 rounded-full text-white/80 hover:text-white hover:bg-white/12 text-[14px] font-semibold transition-colors"
                >
                  {translate(locale, label)}
                </Link>
              ))}
            </nav>

            <div className="flex-1" />

            <Link
              href="/dashboard/telegram"
              className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full glass-nav text-white hover:bg-white/20"
              aria-label="Telegram"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 4L3 11l6 2.5L11 20l3-4.5 5 3.5z" />
                <path d="M9 13.5L21 4" />
              </svg>
            </Link>

            <DashboardMenu
              fullName={profile?.full_name || null}
              email={profile?.email || user.email}
            />
          </div>
        </header>

        <main className="relative z-10 flex-1 px-4 sm:px-6 max-w-[1080px] mx-auto w-full pb-[calc(120px+env(safe-area-inset-bottom))] md:pb-14">
          {children}
        </main>

        <DashboardMobileNav />
      </div>
    </DashboardLanguageProvider>
  );
}
