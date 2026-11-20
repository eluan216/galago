import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GalagoMark } from "@/components/logo";
import { DashboardLanguageProvider } from "@/components/DashboardLanguageProvider";
import { DashboardMenu } from "@/components/DashboardMenu";
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
            Supabase environment variables are missing. Add the values from <code>.env.example</code>,
            then restart the app.
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
    <div className="min-h-screen flex flex-col bg-[var(--bl)] text-white">
      <header className="sticky top-0 z-50 px-4 sm:px-6 py-3">
        <div className="glass-nav max-w-3xl mx-auto rounded-full flex items-center justify-between gap-3 py-1.5 pl-2.5 pr-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 shrink-0 hover:opacity-90"
            >
              <GalagoMark className="w-8 h-8" />
              <span className="font-black uppercase text-[13px] tracking-tight hidden sm:inline">
                Galago
              </span>
            </Link>
            <nav className="flex min-w-0 max-w-[50vw] sm:max-w-none items-center gap-0.5 overflow-x-auto whitespace-nowrap text-[11px] font-bold uppercase tracking-wide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                ["/dashboard", "Overview"],
                ["/dashboard/wallet", "Wallet"],
                ["/dashboard/bills", "Bills"],
                ["/dashboard/esim", "eSIM"],
                ["/dashboard/orders", "Orders"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="shrink-0 px-2.5 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {translate(locale, label)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <DashboardMenu
              fullName={profile?.full_name || null}
              email={profile?.email || user.email}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full pb-12">
        {children}
      </main>
    </div>
    </DashboardLanguageProvider>
  );
}
