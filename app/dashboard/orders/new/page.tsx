"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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

export default function NewOrderPage() {
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
      .select("id, name, rate_kobo, min_qty, max_qty, quality_tier, service_id, services(name, platform_id, action)")
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
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/dashboard/orders" className="text-mist text-sm hover:text-moon">
          ← Orders
        </Link>
        <h1 className="text-2xl font-semibold mt-2">New order</h1>
        <p className="text-mist text-sm mt-1">
          Balance: {balance === null ? "…" : formatNaira(balance)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-bush border border-bush rounded-2xl p-6 space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-mist mb-1.5">Platform</label>
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              setOfferId("");
            }}
            className="w-full bg-night border border-mist/20 rounded-xl px-4 py-3 text-moon focus:outline-none focus:border-gold/60"
          >
            <option value="">All platforms</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-mist mb-1.5">Service</label>
          <select
            value={offerId}
            onChange={(e) => {
              setOfferId(e.target.value);
              const o = offers.find((x) => x.id === e.target.value);
              if (o) setQuantity(o.min_qty);
            }}
            required
            className="w-full bg-night border border-mist/20 rounded-xl px-4 py-3 text-moon focus:outline-none focus:border-gold/60"
          >
            <option value="">Select a service</option>
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
              <label className="block text-sm text-mist mb-1.5">
                Quantity ({selectedOffer.min_qty} – {selectedOffer.max_qty})
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={selectedOffer.min_qty}
                max={selectedOffer.max_qty}
                required
                className="w-full bg-night border border-mist/20 rounded-xl px-4 py-3 text-moon focus:outline-none focus:border-gold/60"
              />
            </div>

            <div>
              <label className="block text-sm text-mist mb-1.5">
                Target link (profile / post / video URL)
              </label>
              <input
                type="url"
                value={targetLink}
                onChange={(e) => setTargetLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-night border border-mist/20 rounded-xl px-4 py-3 text-moon focus:outline-none focus:border-gold/60"
              />
            </div>

            <div className="bg-night rounded-xl p-4 flex justify-between items-center">
              <span className="text-mist text-sm">Total</span>
              <span className="text-xl font-semibold">{formatNaira(totalKobo)}</span>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading || !offerId}
          className="w-full bg-gold text-night font-semibold py-3 rounded-xl hover:bg-gold-glow transition disabled:opacity-60"
        >
          {loading ? "Placing order…" : "Place order (hold funds)"}
        </button>

        <p className="text-mist text-xs text-center">
          Funds are held until the order is delivered. You are only charged for what lands.
        </p>
      </form>
    </div>
  );
}
