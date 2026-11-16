import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-bush px-4 sm:px-6 py-3 flex items-center justify-between bg-night/95 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-night font-bold text-sm">
              G
            </div>
            <span className="font-semibold hidden sm:inline">galago</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg text-mist hover:text-moon hover:bg-bush transition"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/wallet"
              className="px-3 py-1.5 rounded-lg text-mist hover:text-moon hover:bg-bush transition"
            >
              Wallet
            </Link>
            <Link
              href="/dashboard/orders"
              className="px-3 py-1.5 rounded-lg text-mist hover:text-moon hover:bg-bush transition"
            >
              Orders
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-mist hidden sm:inline">
            {profile?.full_name || profile?.email || user.email}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-mist hover:text-moon transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}