import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Dashboard shell — quiet chrome, clear nav, restraint borders.
 */
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
    <div className="min-h-screen flex flex-col bg-night">
      <header className="border-b border-white/[0.06] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-night/90 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-night font-semibold text-[10px]">
              G
            </div>
            <span className="font-medium text-[13px] hidden sm:inline text-moon">
              galago
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 text-[13px]">
            {[
              ["/dashboard", "Overview"],
              ["/dashboard/wallet", "Wallet"],
              ["/dashboard/orders", "Orders"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="px-2.5 py-1.5 rounded-md text-mist hover:text-moon hover:bg-white/[0.04] transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-mist hidden sm:inline truncate max-w-[140px]">
            {profile?.full_name || profile?.email || user.email}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-[12px] text-mist hover:text-moon transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">{children}</main>
    </div>
  );
}
