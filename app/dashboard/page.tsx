import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardLocale } from "@/lib/dashboard-language-server";
import { translate } from "@/lib/dashboard-language";
import { GalagoCard } from "@/components/GalagoCard";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

function greetingFor() {
  const hour = new Date().getHours();
  return hour < 12
    ? "Good morning"
    : hour < 17
      ? "Good afternoon"
      : "Good evening";
}

function firstName(full: string | null | undefined, email?: string | null) {
  if (full?.trim()) return full.trim().split(/\s+/)[0]!;
  if (email) return email.split("@")[0] || "there";
  return "there";
}

export default async function DashboardPage() {
  const locale = await getDashboardLocale();
  const t = (source: string) => translate(locale, source);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user!.id)
    .single();

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

  const name = firstName(profile?.full_name, profile?.email || user?.email);
  const displayName =
    profile?.full_name?.trim() ||
    profile?.email ||
    user?.email ||
    "Galago user";
  const balance = wallet?.balance_kobo ?? 0;

  const services = [
    {
      href: "/dashboard/bills",
      kicker: "VTpass",
      title: "Airtime & bills",
      body: "Top up or pay utilities",
      icon: "phone",
      accent: "#2a1bf7",
    },
    {
      href: "/dashboard/esim",
      kicker: "Travel",
      title: "eSIM data plans",
      body: "Browse plans and manage activations",
      icon: "esim",
      accent: "#7c3aed",
    },
    {
      href: "/dashboard/wallet",
      kicker: "Wallet",
      title: "Naira & USDT",
      body: "Fund and track ledger",
      icon: "wallet",
      accent: "#0d9488",
    },
    {
      href: "/dashboard/orders",
      kicker: "Orders",
      title: "Social engagements",
      body: "Followers, likes, views & more",
      icon: "orders",
      accent: "#e0660b",
    },
    {
      href: "/dashboard/telegram",
      kicker: "Chat",
      title: "Telegram",
      body: "Galago on Telegram",
      icon: "telegram",
      accent: "#0284c7",
    },
  ] as const;

  return (
    <div className="dash-overview space-y-5 sm:space-y-6 pb-4">
      <div className="text-white">
        <h1 className="font-display text-[clamp(31px,5.2vw,46px)] font-bold leading-[1.04]">
          {t(greetingFor())},{" "}
          <span className="greeting-name">{name}</span>
        </h1>
        <p className="mt-2 text-white/75 text-[15px]">
          {t("Your Galago snapshot")}
        </p>
      </div>

      <div className="dash-grid">
        <section className="dash-card-col" aria-label="Galago Card">
          <GalagoCard balanceKobo={balance} displayName={displayName} />
          <div className="flex gap-3 mt-5">
            <Link
              href="/dashboard/wallet"
              className="flex-1 inline-flex items-center justify-center min-h-[52px] rounded-[14px] bg-[var(--li)] text-[var(--ink)] font-bold text-[15px] hover:brightness-105 transition"
            >
              {t("Fund wallet")}
            </Link>
            <Link
              href="/dashboard/orders/new"
              className="flex-1 inline-flex items-center justify-center min-h-[52px] rounded-[14px] text-white font-bold text-[15px] border border-white/35 bg-white/10 hover:bg-white/20 transition"
            >
              {t("New order")}
            </Link>
          </div>
        </section>

        <section className="dash-svc-col dash-panel" aria-labelledby="services-heading">
          <div className="dash-panel-head">
            <div>
              <p className="dash-eyebrow">{t("Everything Galago")}</p>
              <h2 id="services-heading" className="dash-panel-title">
                {t("Services")}
              </h2>
            </div>
            <span className="dash-count">{services.length} live</span>
          </div>
          <div className="grid grid-cols-1 min-[520px]:grid-cols-2 gap-3">
            {services.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="svc-tile group"
                style={{ ["--svc" as string]: s.accent }}
              >
                <ServiceIcon name={s.icon} />
                <div className="min-w-0">
                  <small className="svc-kicker">{t(s.kicker)}</small>
                  <b className="svc-title">{t(s.title)}</b>
                  <span className="svc-body">{t(s.body)}</span>
                </div>
                <svg
                  className="svc-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            ))}
            <div className="svc-tile svc-tile-ghost" aria-disabled>
              <div className="svc-icon">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[25px] h-[25px] fill-none stroke-current [stroke-width:1.7] [stroke-linecap:round] [stroke-linejoin:round]"
                  aria-hidden
                >
                  <path d="m8.5 8-4.2 4 4.2 4M15.5 8l4.2 4-4.2 4M13.6 4.5l-3.2 15" />
                </svg>
              </div>
              <div>
                <small className="svc-kicker">{t("Reseller")}</small>
                <b className="svc-title">{t("API soon")}</b>
                <span className="svc-body">{t("Coming next")}</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="dash-ord-col dash-panel"
          aria-labelledby="orders-heading"
        >
          <div className="dash-panel-head">
            <div>
              <p className="dash-eyebrow">{t("Activity")}</p>
              <h2 id="orders-heading" className="dash-panel-title">
                {t("Recent orders")}
              </h2>
            </div>
            <Link href="/dashboard/orders" className="dash-link">
              {t("View all")}
            </Link>
          </div>

          {recentOrders && recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b-[1.5px] border-[#e4e6f2] text-left">
                    <th className="pb-2.5 pr-2 text-[12px] font-bold uppercase tracking-wide text-[var(--mu)]">
                      {t("ID")}
                    </th>
                    <th className="pb-2.5 pr-2 text-[12px] font-bold uppercase tracking-wide text-[var(--mu)]">
                      {t("Status")}
                    </th>
                    <th className="pb-2.5 pr-2 text-[12px] font-bold uppercase tracking-wide text-[var(--mu)]">
                      {t("Amount")}
                    </th>
                    <th className="pb-2.5 text-[12px] font-bold uppercase tracking-wide text-[var(--mu)] hidden sm:table-cell">
                      {t("Date")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="dash-row">
                      <td className="py-3.5 pr-2 font-mono text-[13px]">
                        {o.id.slice(0, 8)}…
                      </td>
                      <td className="py-3.5 pr-2">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-2.5 py-0.5 rounded-full ${
                            o.status === "completed"
                              ? "bg-[#e6f4d9] text-[#1f6b00]"
                              : o.status === "held"
                                ? "bg-amber-100 text-amber-800"
                                : o.status === "failed"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-[#eef0ff] text-[var(--ink)]"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2 font-bold tabular-nums">
                        {formatNaira(o.amount_kobo)}
                      </td>
                      <td className="py-3.5 text-[var(--mu)] hidden sm:table-cell">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[var(--mu)] m-0">
              {t("No orders yet.")}{" "}
              <Link
                href="/dashboard/orders/new"
                className="text-[var(--bl)] font-semibold underline underline-offset-2"
              >
                {t("Place your first order")}
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function ServiceIcon({ name }: { name: string }) {
  const common =
    "w-[25px] h-[25px] fill-none stroke-current [stroke-width:1.7] [stroke-linecap:round] [stroke-linejoin:round]";
  return (
    <div className="svc-icon">
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        {name === "phone" && (
          <>
            <rect x="6.5" y="2.5" width="11" height="19" rx="2.6" />
            <path d="M10.5 5.5h3M10.8 18.5h2.4" />
            <path d="M14.4 10.6a2.6 2.6 0 010 3.6M16.8 8.6a5.6 5.6 0 010 7.6" />
          </>
        )}
        {name === "esim" && (
          <>
            <path d="M4 8.2 8.2 4H17a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" />
            <path d="M4 9h4.2V4.6" />
            <rect x="10" y="13" width="7" height="5" rx="1" />
            <path d="M10 15.5h7M13.5 13v5" />
          </>
        )}
        {name === "wallet" && (
          <>
            <path d="M3.5 8.2A2.2 2.2 0 0 1 5.7 6h11.6a2 2 0 0 1 2 2v.4" />
            <path d="M3.5 8.2v8.6A2.7 2.7 0 0 0 6.2 19.5h11.6a2.7 2.7 0 0 0 2.7-2.7V8.8a2 2 0 0 0-2-2H5.7" />
            <path d="M20.5 11.4h-3.3a2.2 2.2 0 0 0 0 4.4h3.3" />
            <circle cx="17.4" cy="13.6" r="0.6" fill="currentColor" stroke="none" />
          </>
        )}
        {name === "orders" && (
          <>
            <path d="M20.5 7.9 12 3.2 3.5 7.9v8.2L12 20.8l8.5-4.7z" />
            <path d="M3.7 8.1 12 12.7l8.3-4.6M12 12.7v8" />
            <path d="M7.8 5.6 16.2 10" />
          </>
        )}
        {name === "telegram" && (
          <>
            <path d="M21.4 3.1 2.9 10.2a.6.6 0 0 0-.05 1.1l4.9 2.4 1.9 5.9a.6.6 0 0 0 1 .22l2.7-2.6 4.6 3.4a.7.7 0 0 0 1.1-.4l2.6-16.4a.6.6 0 0 0-.75-.68z" />
            <path d="M7.75 13.7 21.4 3.1 10.4 16.9" />
          </>
        )}
      </svg>
    </div>
  );
}
