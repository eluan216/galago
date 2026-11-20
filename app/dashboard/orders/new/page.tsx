"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useDashboardLanguage } from "@/components/DashboardLanguageProvider";
import { translate } from "@/lib/dashboard-language";

type Platform = { id: string; name: string };
type Offer = {
  id: string;
  name: string;
  rate_kobo: number;
  min_qty: number;
  max_qty: number;
  quality_tier: string;
  service_id: string;
  services: { name: string; platform_id: string; action: string } | null;
};

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

const inputClass =
  "w-full bg-[var(--of)] border-2 border-[var(--ink)]/15 rounded-xl px-3.5 py-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--bl)] transition";

export default function NewOrderPage() {
  const locale = useDashboardLanguage();
  const t = (source: string) => translate(locale, source);
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [platform, setPlatform] = useState("");
  const [offerId, setOfferId] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [targetLink, setTargetLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance_kobo")
        .eq("user_id", user.id)
        .single();
      setBalance(wallet?.balance_kobo ?? 0);
    }

    const { data: plats } = await supabase
      .from("platforms")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order");
    setPlatforms(plats || []);

    const { data: offs } = await supabase
      .from("offers")
      .select(
        "id, name, rate_kobo, min_qty, max_qty, quality_tier, service_id, services(name, platform_id, action)"
      )
      .eq("is_active", true);
    setOffers((offs as any) || []);
  }

  const filteredOffers = platform
    ? offers.filter((o) => o.services?.platform_id === platform)
    : offers;

  const selectedOffer = offers.find((o) => o.id === offerId);
  const totalKobo = selectedOffer ? selectedOffer.rate_kobo * quantity : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!offerId || !selectedOffer) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: offerId,
          quantity,
          target_link: targetLink || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to place order");
        setLoading(false);
        return;
      }

      router.push(`/dashboard/orders?placed=${data.order_id}`);
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <Link
          href="/dashboard/orders"
          className="text-white/60 text-[12px] font-semibold hover:text-[var(--li)] transition-colors"
        >
          {t("← Orders")}
        </Link>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white mt-2">
          {t("New order")}
        </h1>
        <p className="text-white/65 text-[13px] mt-1 tabular-nums">
          {t("Balance")} {balance === null ? "…" : formatNaira(balance)}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white text-[var(--ink)] rounded-[22px] p-5 sm:p-6 space-y-4 shadow-[0_10px_30px_rgba(10,5,90,0.15)]"
      >
        {error && (
          <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
            {t("Platform")}
          </label>
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              setOfferId("");
            }}
            className={inputClass}
          >
            <option value="">{t("All platforms")}</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
            {t("Service")}
          </label>
          <select
            value={offerId}
            onChange={(e) => {
              setOfferId(e.target.value);
              const o = offers.find((x) => x.id === e.target.value);
              if (o) setQuantity(o.min_qty);
            }}
            required
            className={inputClass}
          >
            <option value="">{t("Select a service")}</option>
            {filteredOffers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} · {formatNaira(o.rate_kobo)}/unit
              </option>
            ))}
          </select>
        </div>

        {selectedOffer && (
          <>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
                {t("Quantity")} ({selectedOffer.min_qty}–{selectedOffer.max_qty})
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={selectedOffer.min_qty}
                max={selectedOffer.max_qty}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
                {t("Target link")}
              </label>
              <input
                type="url"
                value={targetLink}
                onChange={(e) => setTargetLink(e.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
            </div>

            <div className="bg-[var(--of)] border-2 border-[var(--ink)]/10 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-[var(--mu)] text-[13px] font-semibold">
                {t("Total (held)")}
              </span>
              <span className="text-lg font-black tabular-nums">
                {formatNaira(totalKobo)}
              </span>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading || !offerId}
          className="btn-galago w-full"
        >
          {loading ? t("Placing order…") : t("Place order · hold funds")}
        </button>

        <p className="text-[var(--mu)] text-[11px] text-center leading-relaxed">
          {t("Funds are held until delivery. You only pay for what lands.")}
        </p>
      </form>
    </div>
  );
}
