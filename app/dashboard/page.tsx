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
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-moon">Overview</h1>
        <p className="text-mist text-[13px] mt-1">Your Galago snapshot</p>
      </div>

      <div className="bg-surface border border-white/[0.06] rounded-card p-5 sm:p-6">
        <p className="text-mist text-[12px]">Available balance</p>
        <p className="text-3xl font-semibold tracking-tight text-moon mt-1 tabular-nums">
          {formatNaira(wallet?.balance_kobo ?? 0)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/wallet"
            className="bg-gold text-night text-[13px] font-semibold px-4 py-2 rounded-full hover:brightness-110 transition"
          >
            Fund wallet
          </Link>
          <Link
            href="/dashboard/orders/new"
            className="border border-white/[0.1] text-moon text-[13px] font-medium px-4 py-2 rounded-full hover:border-white/20 transition"
          >
            New order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/wallet"
          className="bg-surface border border-white/[0.06] rounded-card p-4 hover:border-white/[0.1] transition"
        >
          <p className="text-gold text-[11px] font-medium tracking-wide">Wallet</p>
          <h3 className="text-[14px] font-medium text-moon mt-1">Naira & USDT</h3>
          <p className="text-mist text-[12px] mt-0.5">Fund and track ledger</p>
        </Link>
        <Link
          href="/dashboard/orders"
          className="bg-surface border border-white/[0.06] rounded-card p-4 hover:border-white/[0.1] transition"
        >
          <p className="text-gold text-[11px] font-medium tracking-wide">Orders</p>
          <h3 className="text-[14px] font-medium text-moon mt-1">Campaigns</h3>
          <p className="text-mist text-[12px] mt-0.5">Track deliveries</p>
        </Link>
        <div className="bg-surface border border-white/[0.06] rounded-card p-4 opacity-50">
          <p className="text-gold text-[11px] font-medium tracking-wide">Reseller</p>
          <h3 className="text-[14px] font-medium text-moon mt-1">API soon</h3>
          <p className="text-mist text-[12px] mt-0.5">Coming next</p>
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-medium text-moon mb-3">Recent orders</h2>
        {recentOrders && recentOrders.length > 0 ? (
          <div className="bg-surface border border-white/[0.06] rounded-card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-mist text-left">
                  <th className="px-4 py-2.5 font-medium">ID</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-4 py-2.5 font-mono text-[12px] text-moon">
                      {o.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-2.5 capitalize text-moon">{o.status}</td>
                    <td className="px-4 py-2.5 text-moon tabular-nums">
                      {formatNaira(o.amount_kobo)}
                    </td>
                    <td className="px-4 py-2.5 text-mist">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-mist text-[13px]">No orders yet. Place your first one.</p>
        )}
      </div>
    </div>
  );
}
