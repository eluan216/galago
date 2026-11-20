"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import {
  convertNgnKoboToCurrency,
  currencyFlag,
} from "@/lib/currency-format";
import { useDashboardLanguage } from "@/components/DashboardLanguageProvider";
import { translate } from "@/lib/dashboard-language";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

type LedgerEntry = {
  id: string;
  type: string;
  amount_kobo: number;
  balance_after_kobo: number;
  description: string | null;
  created_at: string;
};

type CryptoDeposit = {
  id: string;
  network: string;
  amount_ngn_kobo: number | null;
  amount_crypto?: number | null;
  status: string;
  pay_url: string | null;
  created_at: string;
};

type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
  decimal_digits: number;
  countries: string[];
};

function formatCurrencyAmount(amount: number, currency: string, digits: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(amount);
}

const inputClass =
  "w-full bg-[var(--of)] border-2 border-[var(--ink)]/15 rounded-xl px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--mu)] focus:outline-none focus:border-[var(--bl)] transition";

const cardClass =
  "bg-white text-[var(--ink)] rounded-[22px] p-5 sm:p-6 shadow-[0_10px_30px_rgba(10,5,90,0.15)]";

function WalletContent() {
  const locale = useDashboardLanguage();
  const t = (source: string) => translate(locale, source);
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<number | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState("NGN");
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
  const [usdtAmount, setUsdtAmount] = useState("10");
  const [fiatAmount, setFiatAmount] = useState("2000");
  const [loading, setLoading] = useState(false);
  const [fiatLoading, setFiatLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("deposit") === "success") {
      setMessage("Deposit successful. Balance updates after network confirms.");
    }
    if (searchParams.get("deposit") === "cancelled") {
      setError("Deposit cancelled.");
    }
    if (searchParams.get("error")) {
      setError("Payment could not be completed. Try again.");
    }
    loadData();
    loadCurrencyRates();
  }, [searchParams]);

  async function loadCurrencyRates() {
    try {
      const response = await fetch("/api/currency/rates");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not load exchange rates");
      }
      setCurrencies(data.currencies || []);
      setRates(data.rates || {});
      setRatesUpdatedAt(data.updated_at || null);
      setRatesError(null);
    } catch (rateError) {
      setRatesError(
        rateError instanceof Error
          ? rateError.message
          : "Could not load exchange rates"
      );
    }
  }

  async function loadData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance_kobo")
      .eq("user_id", user.id)
      .single();

    setBalance(wallet?.balance_kobo ?? 0);

    const { data: entries } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    setLedger(entries || []);

    const { data: crypto } = await supabase
      .from("crypto_deposits")
      .select(
        "id, network, amount_ngn_kobo, amount_crypto, status, pay_url, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setDeposits(crypto || []);
  }

  async function handleDemoCredit() {
    setDemoLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/wallet/demo-credit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Demo credit failed");
      } else {
        setMessage(`Demo +${formatNaira(data.credited_kobo)} added`);
        await loadData();
      }
    } catch {
      setError("Network error");
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleCryptoFund() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const usdt = Number(usdtAmount);
    if (!usdt || usdt < 10) {
      setError("Minimum is 10 USDT");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/crypto/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usdt: usdt, network: "TRC20" }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = data.detail ? ` — ${data.detail}` : "";
        setError((data.error || "Failed to create invoice") + detail);
        setLoading(false);
        return;
      }

      if (data.pay_url) {
        window.location.href = data.pay_url;
      } else {
        setMessage("Invoice created. Refresh to see status.");
        loadData();
        setLoading(false);
      }
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  async function handleFiatFund() {
    setFiatLoading(true);
    setError(null);
    setMessage(null);

    const ngn = Number(fiatAmount);
    if (!ngn || ngn < 100) {
      setError("Minimum is ₦100");
      setFiatLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/fiat/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_ngn: ngn }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start payment");
        setFiatLoading(false);
        return;
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch {
      setError("Network error. Try again.");
      setFiatLoading(false);
    }
  }

  const pending = deposits.filter(
    (d) => d.status === "pending" || d.status === "confirming"
  );
  const selectedCurrencyInfo = currencies.find(
    (currency) => currency.code === displayCurrency
  );
  const convertedBalance =
    balance === null
      ? null
      : convertNgnKoboToCurrency(balance, displayCurrency, rates);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">
          {t("Wallet")}
        </h1>
        <p className="text-white/65 text-[13px] mt-1">
          {t("Fund with Naira or USDT. One balance for everything.")}
        </p>
      </div>

      <div className={cardClass}>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--mu)]">
          {t("Available balance")}
        </p>
        <p className="text-3xl font-black tracking-tight mt-1 tabular-nums">
          {balance === null
            ? "…"
            : convertedBalance === null || displayCurrency === "NGN"
              ? formatNaira(balance)
              : formatCurrencyAmount(
                  convertedBalance,
                  displayCurrency,
                  selectedCurrencyInfo?.decimal_digits ?? 2
                )}
        </p>
        <label className="block text-[12px] font-semibold text-[var(--mu)] mt-4 mb-1.5">
          {t("Display balance in")}
        </label>
        <select
          value={displayCurrency}
          onChange={(event) => setDisplayCurrency(event.target.value)}
          className={inputClass}
          disabled={currencies.length === 0}
        >
          <option value="NGN">🇳🇬 NGN — Nigerian Naira</option>
          {currencies
            .filter((currency) => currency.code !== "NGN")
            .map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currencyFlag(currency.countries)} {currency.code} — {currency.name}
              </option>
            ))}
        </select>
        <p className="text-[11px] text-[var(--mu)] mt-2">
          {t("Display conversion only; your spendable balance and all charges remain in NGN.")}
          {ratesUpdatedAt
            ? ` Rates updated ${new Date(ratesUpdatedAt).toLocaleString()}.`
            : ""}
        </p>
        {ratesError && (
          <p role="alert" className="text-[11px] text-rose-700 mt-2">
            Currency conversion unavailable: {ratesError}
          </p>
        )}
        <button
          type="button"
          onClick={handleDemoCredit}
          disabled={demoLoading}
          className="mt-4 text-[11px] font-bold uppercase tracking-wide text-[var(--bl)] hover:underline disabled:opacity-50"
        >
          {demoLoading ? t("Crediting…") : t("Add demo ₦5,000 (test loop)")}
        </button>
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px] font-medium break-words">
          {error}
        </div>
      )}
      {message && (
        <div className="px-3.5 py-2.5 rounded-xl bg-[var(--li)]/25 border border-[var(--li)]/50 text-[var(--ink)] text-[13px] font-medium">
          {message}
        </div>
      )}

      <div className={cardClass}>
        <h2 className="text-[15px] font-black uppercase tracking-tight">
          {t("Fund with Naira")}
        </h2>
        <p className="text-[var(--mu)] text-[13px] mt-1 mb-4">
          {t("Card, bank transfer, USSD via Paystack.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
              {t("Amount (NGN)")}
            </label>
            <input
              type="number"
              value={fiatAmount}
              onChange={(e) => setFiatAmount(e.target.value)}
              min={100}
              step={100}
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFiatFund}
              disabled={fiatLoading}
              className="btn-galago btn-galago-sm w-full sm:w-auto"
            >
              {fiatLoading ? t("Redirecting…") : t("Pay with Paystack")}
            </button>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-[15px] font-black uppercase tracking-tight">
          {t("Fund with USDT")}
        </h2>
        <p className="text-[var(--mu)] text-[13px] mt-1 mb-4">
          {t("Amount in USDT. TRC20. Credited to Naira after confirmation.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
              {t("Amount (USDT)")}
            </label>
            <input
              type="number"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              min={10}
              step={1}
              className={inputClass}
              placeholder="10"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCryptoFund}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center text-[12px] font-extrabold uppercase tracking-wide px-5 py-2.5 rounded-full border-2 border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white transition disabled:opacity-50"
            >
              {loading ? t("Creating invoice…") : t("Pay with USDT")}
            </button>
          </div>
        </div>
        <p className="text-[var(--mu)] text-[11px] mt-3">
          {t("Minimum 10 USDT · Network TRC20 only")}
        </p>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-white mb-3">
            {t("Pending deposits")}
          </h2>
          <div className="space-y-2">
            {pending.map((d) => (
              <div
                key={d.id}
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 flex items-center justify-between text-white"
              >
                <div>
                  <p className="text-[13px] tabular-nums">
                    {d.amount_crypto != null
                      ? `${d.amount_crypto} USDT`
                      : d.amount_ngn_kobo
                        ? formatNaira(d.amount_ngn_kobo)
                        : "—"}
                    <span className="text-white/60"> · {d.network}</span>
                  </p>
                  <p className="text-white/55 text-[11px] capitalize mt-0.5">
                    {d.status}
                  </p>
                </div>
                {d.pay_url && (
                  <a
                    href={d.pay_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--li)] text-[12px] font-semibold hover:underline"
                  >
                    {t("Open invoice")}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-white mb-3">
          {t("Transaction history")}
        </h2>
        {ledger.length === 0 ? (
          <p className="text-white/60 text-[13px]">{t("No transactions yet.")}</p>
        ) : (
          <div className="bg-white text-[var(--ink)] rounded-[18px] overflow-hidden shadow-[0_8px_20px_rgba(10,5,90,0.12)]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--ink)]/10 text-[var(--mu)] text-left">
                  <th className="px-4 py-2.5 font-semibold">{t("Type")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("Amount")}</th>
                  <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">
                    {t("Balance")}
                  </th>
                  <th className="px-4 py-2.5 font-semibold">{t("Date")}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-[var(--ink)]/6 last:border-0"
                  >
                    <td className="px-4 py-2.5 capitalize">
                      {e.type.replace(/_/g, " ")}
                    </td>
                    <td
                      className={`px-4 py-2.5 font-mono tabular-nums font-medium ${
                        e.amount_kobo >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {e.amount_kobo >= 0 ? "+" : ""}
                      {formatNaira(e.amount_kobo)}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--mu)] tabular-nums hidden sm:table-cell">
                      {formatNaira(e.balance_after_kobo)}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--mu)]">
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WalletPage() {
  const locale = useDashboardLanguage();
  return (
    <Suspense
      fallback={
        <div className="text-white/60 text-[13px]">
          {translate(locale, "Loading wallet…")}
        </div>
      }
    >
      <WalletContent />
    </Suspense>
  );
}
