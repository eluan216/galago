import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, amount_kobo, quantity, target_link, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-mist text-sm mt-1">Your growth campaigns and deliveries</p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="bg-gold text-night px-4 py-2 rounded-xl text-sm font-medium hover:bg-gold-glow transition"
        >
          New order
        </Link>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="bg-bush border border-bush rounded-2xl p-12 text-center">
          <p className="text-mist">No orders yet.</p>
          <Link
            href="/dashboard/orders/new"
            className="inline-block mt-4 text-gold hover:underline text-sm"
          >
            Place your first order
          </Link>
        </div>
      ) : (
        <div className="bg-bush border border-bush rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-night text-mist text-left">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-night/50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 capitalize">{o.status}</td>
                  <td className="px-4 py-3">{o.quantity}</td>
                  <td className="px-4 py-3">{formatNaira(o.amount_kobo)}</td>
                  <td className="px-4 py-3 text-mist">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}