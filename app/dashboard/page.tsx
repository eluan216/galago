import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance_kobo")
    .eq("user_id", user!.id)
    .single();

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, status, amount_kobo, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Overview</h1>
        <p className="text-white/65 text-[13px] mt-1">Your Galago snapshot</p>
      </div>

      <div className="bg-white text-[var(--ink)] rounded-[22px] p-6 shadow-[0_10px_30px_rgba(10,5,90,0.2)]">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--mu)]">
          Available balance
        </p>
        <p className="text-3xl font-black tracking-tight mt-1 tabular-nums">
          {formatNaira(wallet?.balance_kobo ?? 0)}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/dashboard/wallet" className="btn-galago btn-galago-sm">
            Fund wallet
          </Link>
          <Link
            href="/dashboard/orders/new"
            className="inline-flex items-center justify-center text-[12px] font-extrabold uppercase tracking-wide px-4 py-2.5 rounded-full border-2 border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white transition"
          >
            New order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            href: "/dashboard/wallet",
            kicker: "Wallet",
            title: "Naira & USDT",
            body: "Fund and track ledger",
          },
          {
            href: "/dashboard/orders",
            kicker: "Orders",
            title: "Campaigns",
            body: "Track deliveries",
          },
          {
            href: "#",
            kicker: "Reseller",
            title: "API soon",
            body: "Coming next",
            muted: true,
          },
        ].map((c) =>
          c.muted ? (
            <div
              key={c.kicker}
              className="bg-white/10 border border-white/15 rounded-[18px] p-4 opacity-60"
            >
              <p className="text-[var(--li)] text-[11px] font-bold uppercase tracking-wide">
                {c.kicker}
              </p>
              <h3 className="text-[14px] font-bold mt-1">{c.title}</h3>
              <p className="text-white/60 text-[12px] mt-0.5">{c.body}</p>
            </div>
          ) : (
            <Link
              key={c.kicker}
              href={c.href}
              className="bg-white text-[var(--ink)] rounded-[18px] p-4 hover:-translate-y-0.5 transition-transform shadow-[0_8px_20px_rgba(10,5,90,0.15)]"
            >
              <p className="text-[var(--bl)] text-[11px] font-bold uppercase tracking-wide">
                {c.kicker}
              </p>
              <h3 className="text-[14px] font-bold mt-1">{c.title}</h3>
              <p className="text-[var(--mu)] text-[12px] mt-0.5">{c.body}</p>
            </Link>
          )
        )}
      </div>

      <div>
        <h2 className="text-[13px] font-bold uppercase tracking-wide mb-3">
          Recent orders
        </h2>
        {recentOrders && recentOrders.length > 0 ? (
          <div className="bg-white text-[var(--ink)] rounded-[18px] overflow-hidden shadow-[0_8px_20px_rgba(10,5,90,0.12)]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--ink)]/10 text-[var(--mu)] text-left">
                  <th className="px-4 py-2.5 font-semibold">ID</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Amount</th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-[var(--ink)]/6 last:border-0"
                  >
                    <td className="px-4 py-2.5 font-mono text-[12px]">
                      {o.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-2.5 capitalize">{o.status}</td>
                    <td className="px-4 py-2.5 tabular-nums font-medium">
                      {formatNaira(o.amount_kobo)}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--mu)]">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-white/60 text-[13px]">
            No orders yet.{" "}
            <Link href="/dashboard/orders/new" className="text-[var(--li)] font-semibold">
              Place your first one
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
