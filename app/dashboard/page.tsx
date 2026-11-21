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

function greetingFor(name: string) {
  const hour = new Date().getHours();
  const hello =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${hello}, ${name}`;
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

  const name = firstName(
    profile?.full_name,
    profile?.email || user?.email
  );
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
    },
    {
      href: "/dashboard/esim",
      kicker: "Travel",
      title: "eSIM data plans",
      body: "Browse plans and manage activations",
      icon: "esim",
    },
    {
      href: "/dashboard/wallet",
      kicker: "Wallet",
      title: "Naira & USDT",
      body: "Fund and track ledger",
      icon: "wallet",
    },
    {
      href: "/dashboard/orders",
      kicker: "Orders",
      title: "Campaigns",
      body: "Track deliveries",
      icon: "orders",
    },
    {
      href: "/dashboard/telegram",
      kicker: "Chat",
      title: "Telegram",
      body: "Galago on Telegram",
      icon: "telegram",
    },
  ] as const;

  return (
    <div className="dash-overview space-y-5 sm:space-y-6 pb-4">
      <div className="text-white">
        <h1 className="text-[clamp(28px,5vw,40px)] font-extrabold tracking-tight leading-tight">
          {greetingFor(name)}
        </h1>
        <p className="mt-1 text-white/80 text-[15px]">{t("Your Galago snapshot")}</p>
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

        <section
          className="dash-svc-col bg-white text-[var(--ink)] rounded-[24px] p-5 sm:p-6 shadow-[0_16px_40px_rgba(8,4,80,0.25)]"
          aria-labelledby="services-heading"
        >
          <h2
            id="services-heading"
            className="text-[18px] font-bold tracking-tight m-0 mb-4"
          >
            {t("Services")}
          </h2>
          <div className="grid grid-cols-1 min-[520px]:grid-cols-2 gap-3">
            {services.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="flex gap-3.5 items-start p-4 border-[1.5px] border-[#e4e6f2] rounded-[18px] hover:border-[var(--bl)] hover:bg-[#f7f8ff] transition"
              >
                <ServiceIcon name={s.icon} />
                <div>
                  <small className="block text-[11px] font-bold tracking-wide uppercase text-[var(--bl)]">
                    {t(s.kicker)}
                  </small>
                  <b className="block text-[16px] leading-snug mt-0.5">
                    {t(s.title)}
                  </b>
                  <span className="block text-[14px] text-[var(--mu)] leading-snug mt-0.5">
                    {t(s.body)}
                  </span>
                </div>
              </Link>
            ))}
            <div
              className="flex gap-3.5 items-start p-4 border-[1.5px] border-dashed border-[#e4e6f2] rounded-[18px] bg-[#f6f7fb] opacity-80"
              aria-disabled
            >
              <div className="shrink-0 w-11 h-11 rounded-xl bg-[#e9eaf2] grid place-items-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
                  fill="none"
                  stroke="#5a5780"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14" />
                </svg>
              </div>
              <div>
                <small className="block text-[11px] font-bold tracking-wide uppercase text-[var(--mu)]">
                  {t("Reseller")}
                </small>
                <b className="block text-[16px] text-[#6c6a8a]">{t("API soon")}</b>
                <span className="block text-[14px] text-[#6c6a8a]">
                  {t("Coming next")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="dash-ord-col bg-white text-[var(--ink)] rounded-[24px] p-5 sm:p-6 shadow-[0_16px_40px_rgba(8,4,80,0.25)]"
          aria-labelledby="orders-heading"
        >
          <div className="flex justify-between items-baseline mb-4">
            <h2
              id="orders-heading"
              className="text-[18px] font-bold tracking-tight m-0"
            >
              {t("Recent orders")}
            </h2>
            <Link
              href="/dashboard/orders"
              className="text-[var(--bl)] font-semibold text-[14px]"
            >
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
                    <tr key={o.id} className="border-b border-[#e4e6f2]/40 last:border-0">
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
    "w-6 h-6 fill-none stroke-[var(--bl)] stroke-2 [stroke-linecap:round] [stroke-linejoin:round]";
  return (
    <div className="shrink-0 w-11 h-11 rounded-xl bg-[#eef0ff] grid place-items-center">
      <svg viewBox="0 0 24 24" className={common}>
        {name === "phone" && (
          <>
            <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
            <path d="M11 18.5h2M10 7h4M10 10.5h4" />
          </>
        )}
        {name === "esim" && (
          <>
            <path d="M6 3h8l5 5v13H6z" />
            <rect x="9" y="12" width="7" height="6" rx="1.2" />
            <path d="M9 15h7M12.5 12v6" />
          </>
        )}
        {name === "wallet" && (
          <>
            <path d="M4 7.5A2.5 2.5 0 016.5 5H19v14H6.5A2.5 2.5 0 014 16.5z" />
            <path d="M19 9h-4a2 2 0 000 4h4" />
          </>
        )}
        {name === "orders" && (
          <>
            <path d="M3 11v3l12 5V6z" />
            <path d="M15 9.5a3 3 0 010 6M6 14.5l1.2 5" />
          </>
        )}
        {name === "telegram" && (
          <>
            <path d="M21 4L3 11l6 2.5L11 20l3-4.5 5 3.5z" />
            <path d="M9 13.5L21 4" />
          </>
        )}
      </svg>
    </div>
  );
}
