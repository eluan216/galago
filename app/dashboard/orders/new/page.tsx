"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useDashboardLanguage } from "@/components/DashboardLanguageProvider";
import { translate } from "@/lib/dashboard-language";

type Platform = { id: string; name: string };
type Service = {
  id: string;
  name: string;
  platform_id: string | null;
  category: string | null;
  action: string | null;
  offerCount: number;
};
type Offer = {
  id: string;
  name: string;
  rate_kobo: number;
  min_qty: number;
  max_qty: number;
  quality_tier: string | null;
  service_id: string;
};

const ACTION_LABELS: Record<string, string> = {
  followers: "Followers",
  likes: "Likes",
  views: "Views",
  members: "Members",
  subscribers: "Subscribers",
  engagement: "Engagement",
  plays: "Plays",
  streams: "Streams",
  comments: "Comments",
  shares: "Shares",
  reposts: "Reposts",
  saves: "Saves",
  votes: "Votes",
  traffic: "Traffic",
  reactions: "Reactions",
  impressions: "Impressions",
};

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

function formatUnitNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(kobo / 100);
}

const inputClass =
  "w-full bg-[var(--of)] border-2 border-[var(--ink)]/15 rounded-xl px-3.5 py-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--bl)] transition";

export default function NewOrderPage() {
  const locale = useDashboardLanguage();
  const t = useCallback((source: string) => translate(locale, source), [locale]);
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [platform, setPlatform] = useState("");
  const [action, setAction] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [offerId, setOfferId] = useState("");
  const [offerQuery, setOfferQuery] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [targetLink, setTargetLink] = useState("");
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCatalogue = useCallback(async () => {
    const supabase = createClient();
    const [{ data: plats }, { data: svcs }] = await Promise.all([
      supabase
        .from("platforms")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order")
        .order("name"),
      supabase
        .from("services")
        .select("id, name, platform_id, category, action, offers(count)")
        .eq("is_active", true)
        .eq("offers.is_active", true)
        .order("name"),
    ]);
    setPlatforms(plats || []);
    setServices(
      ((svcs as unknown as Array<
        Service & { offers?: { count: number }[] }
      >) || [])
        .map((s) => ({
          id: s.id,
          name: s.name,
          platform_id: s.platform_id,
          category: s.category,
          action: s.action || "engagement",
          offerCount: s.offers?.[0]?.count ?? 0,
        }))
        .filter((s) => s.offerCount > 0)
    );
  }, []);

  useEffect(() => {
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

      await loadCatalogue();
    }
    load();
  }, [loadCatalogue]);

  useEffect(() => {
    let cancelled = false;
    async function refreshCatalogue() {
      try {
        const res = await fetch("/api/catalog/sync", { method: "POST" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setNotice(
            data.error ||
              t("Live catalogue unavailable — showing saved services.")
          );
          return;
        }
        if (!data.skipped && data.offers) {
          await loadCatalogue();
          if (cancelled) return;
          setNotice(
            `${t("Catalogue updated")} · ${data.offers.toLocaleString()} ${t(
              "services"
            )}`
          );
        }
      } catch {
        if (!cancelled) {
          setNotice(t("Live catalogue unavailable — showing saved services."));
        }
      }
    }
    refreshCatalogue();
    return () => {
      cancelled = true;
    };
  }, [loadCatalogue, t]);

  const servicesForPlatform = useMemo(() => {
    if (!platform) return [];
    return services.filter((s) => s.platform_id === platform);
  }, [platform, services]);

  const actionsForPlatform = useMemo(() => {
    const set = new Map<string, number>();
    for (const s of servicesForPlatform) {
      const a = (s.action || "engagement").toLowerCase();
      set.set(a, (set.get(a) || 0) + s.offerCount);
    }
    return [...set.entries()]
      .map(([id, count]) => ({
        id,
        label: ACTION_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1),
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [servicesForPlatform]);

  const servicesForStep = useMemo(() => {
    if (!platform || !action) return [];
    return servicesForPlatform.filter(
      (s) => (s.action || "engagement").toLowerCase() === action
    );
  }, [platform, action, servicesForPlatform]);

  const filteredOffers = useMemo(() => {
    const q = offerQuery.trim().toLowerCase();
    if (!q) return offers;
    return offers.filter((o) => o.name.toLowerCase().includes(q));
  }, [offers, offerQuery]);

  async function loadOffers(nextServiceId: string) {
    setOffers([]);
    setOfferId("");
    setOfferQuery("");
    if (!nextServiceId) return;
    setLoadingOffers(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("offers")
      .select("id, name, rate_kobo, min_qty, max_qty, quality_tier, service_id")
      .eq("service_id", nextServiceId)
      .eq("is_active", true)
      .order("rate_kobo")
      .limit(200);
    setOffers((data as Offer[]) || []);
    setLoadingOffers(false);
  }

  function resetFromPlatform(next: string) {
    setPlatform(next);
    setAction("");
    setServiceId("");
    setOfferId("");
    setOffers([]);
    setOfferQuery("");
  }

  function resetFromAction(next: string) {
    setAction(next);
    setServiceId("");
    setOfferId("");
    setOffers([]);
    setOfferQuery("");
  }

  const selectedOffer = offers.find((o) => o.id === offerId);
  const totalKobo = selectedOffer
    ? Math.max(1, Math.ceil(selectedOffer.rate_kobo * quantity))
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!offerId || !selectedOffer) return;
    if (!targetLink.trim()) {
      setError(t("Target link is required"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: offerId,
          quantity,
          target_link: targetLink.trim(),
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
    <div className="max-w-lg space-y-6">
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
        <p className="text-white/65 text-[13px] mt-1">
          {t("Social engagements")} · {t("Balance")}{" "}
          {balance === null ? "…" : formatNaira(balance)}
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

        {/* Step 1 — Platform */}
        <div>
          <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
            1 · {t("Platform")}
          </label>
          <select
            value={platform}
            onChange={(e) => resetFromPlatform(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">{t("Select a platform")}</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2 — Action */}
        {platform && (
          <div>
            <label className="block text-[12px] font-semibold text-[var(--mu)] mb-2">
              2 · {t("What do you need?")}
            </label>
            {actionsForPlatform.length === 0 ? (
              <p className="text-[13px] text-[var(--mu)]">
                {t("No services for this platform yet.")}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {actionsForPlatform.map((a) => {
                  const active = action === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => resetFromAction(a.id)}
                      className={`px-3.5 py-2 rounded-full text-[13px] font-bold border-2 transition ${
                        active
                          ? "bg-[var(--bl)] border-[var(--bl)] text-white"
                          : "border-[var(--ink)]/15 text-[var(--ink)] hover:border-[var(--bl)]"
                      }`}
                    >
                      {t(a.label)}
                      <span
                        className={`ml-1.5 text-[11px] font-semibold ${
                          active ? "text-white/70" : "text-[var(--mu)]"
                        }`}
                      >
                        {a.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Service category */}
        {platform && action && (
          <div>
            <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
              3 · {t("Service")}
              {servicesForStep.length > 0 && (
                <span className="ml-1.5 font-normal text-[var(--mu)]/70">
                  ({servicesForStep.length})
                </span>
              )}
            </label>
            <select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                loadOffers(e.target.value);
              }}
              required
              className={inputClass}
            >
              <option value="">{t("Select a service")}</option>
              {servicesForStep.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.offerCount > 1 ? ` · ${s.offerCount}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 4 — Offer search + select */}
        {serviceId && (
          <div className="space-y-2">
            <label className="block text-[12px] font-semibold text-[var(--mu)]">
              4 · {t("Option")}
              {offers.length > 0 && (
                <span className="ml-1.5 font-normal text-[var(--mu)]/70">
                  ({offers.length}
                  {offers.length >= 200 ? "+" : ""})
                </span>
              )}
            </label>
            {offers.length > 6 && (
              <input
                type="search"
                value={offerQuery}
                onChange={(e) => setOfferQuery(e.target.value)}
                placeholder={t("Search options…")}
                className={inputClass}
              />
            )}
            <select
              value={offerId}
              onChange={(e) => {
                setOfferId(e.target.value);
                const o = offers.find((x) => x.id === e.target.value);
                if (o) setQuantity(o.min_qty);
              }}
              required
              className={inputClass}
              disabled={loadingOffers}
            >
              <option value="">
                {loadingOffers ? t("Loading…") : t("Select an option")}
              </option>
              {filteredOffers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} · {formatUnitNaira(o.rate_kobo)} {t("per unit")}
                </option>
              ))}
            </select>
            {!loadingOffers && offers.length === 0 && (
              <p className="text-[11px] text-[var(--mu)]">
                {t("No options for this service yet.")}
              </p>
            )}
            {!loadingOffers && offers.length > 0 && filteredOffers.length === 0 && (
              <p className="text-[11px] text-[var(--mu)]">
                {t("No options match your search.")}
              </p>
            )}
            {!loadingOffers && offers.length > 0 && (
              <p className="text-[11px] text-[var(--mu)]">
                {t("Prices are in naira per unit — provider rate plus margin.")}
              </p>
            )}
          </div>
        )}

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
                required
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

        {notice && (
          <p className="text-[var(--mu)] text-[11px] text-center">{notice}</p>
        )}
      </form>
    </div>
  );
}
