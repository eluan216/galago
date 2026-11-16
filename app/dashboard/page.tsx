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
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-mist text-sm mt-1">Welcome back. Here&apos;s your Galago snapshot.</p>
      </div>

      {/* Balance card */}
      <div className="bg-bush border border-bush rounded-2xl p-6">
        <p className="text-mist text-sm">Available balance</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">
          {formatNaira(wallet?.balance_kobo ?? 0)}
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/dashboard/wallet"
            className="bg-gold text-night px-4 py-2 rounded-xl text-sm font-medium hover:bg-gold-glow transition"
          >
            Fund wallet
          </Link>
          <Link
            href="/dashboard/orders/new"
            className="border border-mist/30 px-4 py-2 rounded-xl text-sm hover:border-gold/40 transition"
          >
            New order
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/wallet"
          className="bg-bush border border-bush rounded-xl p-5 hover:border-gold/30 transition"
        >
          <div className="text-gold text-lg mb-1">₿</div>
          <h3 className="font-medium">Wallet & Crypto</h3>
          <p className="text-mist text-sm mt-1">Fund with Naira or USDT</p>
        </Link>
        <Link
          href="/dashboard/orders"
          className="bg-bush border border-bush rounded-xl p-5 hover:border-gold/30 transition"
        >
          <div className="text-gold text-lg mb-1">◎</div>
          <h3 className="font-medium">Orders</h3>
          <p className="text-mist text-sm mt-1">Track growth & deliveries</p>
        </Link>
        <div className="bg-bush border border-bush rounded-xl p-5 opacity-60">
          <div className="text-gold text-lg mb-1">☾</div>
          <h3 className="font-medium">Reseller</h3>
          <p className="text-mist text-sm mt-1">Coming soon</p>
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <h2 className="font-medium mb-3">Recent orders</h2>
        {recentOrders && recentOrders.length > 0 ? (
          <div className="bg-bush border border-bush rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-night text-mist text-left">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-night/50 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">
                      {o.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 capitalize">{o.status}</td>
                    <td className="px-4 py-3">{formatNaira(o.amount_kobo)}</td>
                    <td className="px-4 py-3 text-mist">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-mist text-sm">No orders yet. Place your first one.</p>
        )}
      </div>
    </div>
  );
}