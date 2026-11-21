"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDashboardLanguage } from "@/components/DashboardLanguageProvider";
import { translate } from "@/lib/dashboard-language";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

type Order = {
  id: string;
  status: string;
  amount_kobo: number;
  quantity: number;
  target_link: string | null;
  provider_order_id?: string | null;
  created_at: string;
};

export default function OrdersPage() {
  const locale = useDashboardLanguage();
  const t = (source: string) => translate(locale, source);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("orders")
      .select(
        "id, status, amount_kobo, quantity, target_link, provider_order_id, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function complete(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${id}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Complete failed");
      } else {
        setMessage(`Order ${id.slice(0, 8)}… settled (completed)`);
        await load();
      }
    } catch {
      setError("Network error");
    } finally {
      setBusyId(null);
    }
  }

  async function release(id: string) {
    if (!confirm("Release hold and return funds to wallet?")) return;
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${id}/release`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Release failed");
      } else {
        setMessage(
          `Hold released — ${formatNaira(data.released_kobo || 0)} returned`
        );
        await load();
      }
    } catch {
      setError("Network error");
    } finally {
      setBusyId(null);
    }
  }

  async function syncProvider(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${id}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.detail || "Sync failed");
      } else {
        const action = data.action || "ok";
        const pStatus = data.provider?.status || "";
        setMessage(
          `Synced · ${action}${pStatus ? ` (provider: ${pStatus})` : ""}`
        );
        await load();
      }
    } catch {
      setError("Network error");
    } finally {
      setBusyId(null);
    }
  }

  const openStatuses = ["held", "processing", "partial"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            {t("Orders")}
          </h1>
          <p className="text-white/65 text-[13px] mt-1">
            {t("Hold → deliver (settle) or release")}
          </p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="btn-galago btn-galago-sm shrink-0"
        >
          {t("New order")}
        </Link>
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
          {error}
        </div>
      )}
      {message && (
        <div className="px-3.5 py-2.5 rounded-xl bg-[var(--li)]/30 border border-[var(--li)] text-[var(--ink)] text-[13px] font-medium">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-white/60 text-[13px]">{t("Loading…")}</p>
      ) : orders.length === 0 ? (
        <div className="bg-white text-[var(--ink)] rounded-[22px] px-6 py-14 text-center shadow-[0_10px_30px_rgba(10,5,90,0.15)]">
          <p className="text-[var(--mu)] text-[13px]">{t("No orders yet.")}</p>
          <Link
            href="/dashboard/orders/new"
            className="inline-block mt-3 text-[var(--bl)] text-[13px] font-bold hover:underline"
          >
            {t("Place your first order")}
          </Link>
        </div>
      ) : (
        <div className="bg-white text-[var(--ink)] rounded-[18px] overflow-hidden shadow-[0_8px_20px_rgba(10,5,90,0.12)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--ink)]/10 text-[var(--mu)] text-left">
                  <th className="px-4 py-2.5 font-semibold">ID</th>
                  <th className="px-4 py-2.5 font-semibold">{t("Status")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("Qty")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("Amount")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("Date")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("Actions")}</th>
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
                    <td className="px-4 py-2.5 capitalize">
                      <span
                        className={
                          o.status === "held"
                            ? "text-amber-600 font-semibold"
                            : o.status === "processing"
                              ? "text-sky-600 font-semibold"
                              : o.status === "completed"
                                ? "text-emerald-600 font-semibold"
                                : o.status === "failed"
                                  ? "text-rose-600 font-semibold"
                                  : ""
                        }
                      >
                        {t(o.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{o.quantity}</td>
                    <td className="px-4 py-2.5 tabular-nums font-medium">
                      {formatNaira(o.amount_kobo)}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--mu)]">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      {openStatuses.includes(o.status) ? (
                        <div className="flex flex-wrap gap-1.5">
                          {o.provider_order_id && (
                            <button
                              type="button"
                              disabled={busyId === o.id}
                              onClick={() => syncProvider(o.id)}
                              className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[var(--bl)] text-white disabled:opacity-50"
                            >
                              {busyId === o.id ? "…" : "Sync"}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busyId === o.id}
                            onClick={() => complete(o.id)}
                            className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[var(--li)] text-[var(--ink)] border border-[var(--ink)] disabled:opacity-50"
                          >
                            {busyId === o.id ? "…" : t("Settle")}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === o.id}
                            onClick={() => release(o.id)}
                            className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border border-[var(--ink)]/30 text-[var(--ink)] disabled:opacity-50"
                          >
                            {t("Release")}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[var(--mu)] text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-white/50 text-[11px] leading-relaxed">
        <strong className="text-white/70">Sync</strong> polls the provider and
        settles or releases automatically.{" "}
        <strong className="text-white/70">Settle</strong> /{" "}
        <strong className="text-white/70">Release</strong> are manual overrides.
      </p>
    </div>
  );
}
