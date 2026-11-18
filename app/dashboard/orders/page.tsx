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
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Orders
          </h1>
          <p className="text-white/65 text-[13px] mt-1">
            Growth campaigns and deliveries
          </p>
        </div>
        <Link href="/dashboard/orders/new" className="btn-galago btn-galago-sm shrink-0">
          New order
        </Link>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="bg-white text-[var(--ink)] rounded-[22px] px-6 py-14 text-center shadow-[0_10px_30px_rgba(10,5,90,0.15)]">
          <p className="text-[var(--mu)] text-[13px]">No orders yet.</p>
          <Link
            href="/dashboard/orders/new"
            className="inline-block mt-3 text-[var(--bl)] text-[13px] font-bold hover:underline"
          >
            Place your first order
          </Link>
        </div>
      ) : (
        <div className="bg-white text-[var(--ink)] rounded-[18px] overflow-hidden shadow-[0_8px_20px_rgba(10,5,90,0.12)]">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--ink)]/10 text-[var(--mu)] text-left">
                <th className="px-4 py-2.5 font-semibold">ID</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Qty</th>
                <th className="px-4 py-2.5 font-semibold">Amount</th>
                <th className="px-4 py-2.5 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-[var(--ink)]/6 last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-[12px]">
                    {o.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-2.5 capitalize">{o.status}</td>
                  <td className="px-4 py-2.5 tabular-nums">{o.quantity}</td>
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
      )}
    </div>
  );
}
