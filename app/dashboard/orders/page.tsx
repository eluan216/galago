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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-moon">Orders</h1>
          <p className="text-mist text-[13px] mt-1">Growth campaigns and deliveries</p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="bg-gold text-night text-[13px] font-semibold px-4 py-2 rounded-full hover:brightness-110 transition shrink-0"
        >
          New order
        </Link>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="bg-surface border border-white/[0.06] rounded-card px-6 py-14 text-center">
          <p className="text-mist text-[13px]">No orders yet.</p>
          <Link
            href="/dashboard/orders/new"
            className="inline-block mt-3 text-gold text-[13px] hover:underline"
          >
            Place your first order
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-white/[0.06] rounded-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-mist text-left">
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Qty</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-white/[0.04] last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-[12px] text-moon">
                    {o.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-2.5 capitalize text-moon">{o.status}</td>
                  <td className="px-4 py-2.5 text-moon tabular-nums">{o.quantity}</td>
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
      )}
    </div>
  );
}
