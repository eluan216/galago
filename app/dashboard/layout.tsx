import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GalagoMark } from "@/components/logo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
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
            <nav className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wide">
              {[
                ["/dashboard", "Overview"],
                ["/dashboard/wallet", "Wallet"],
                ["/dashboard/orders", "Orders"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="px-2.5 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-white/60 hidden sm:inline truncate max-w-[120px]">
              {profile?.full_name || profile?.email || user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-[11px] font-bold uppercase tracking-wide text-white/70 hover:text-[var(--li)] transition-colors px-2"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full pb-12">
        {children}
      </main>
    </div>
  );
}
