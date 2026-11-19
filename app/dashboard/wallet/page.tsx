"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

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

const inputClass =
  "w-full bg-[var(--of)] border-2 border-[var(--ink)]/15 rounded-xl px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--mu)] focus:outline-none focus:border-[var(--bl)] transition";

const cardClass =
  "bg-white text-[var(--ink)] rounded-[22px] p-5 sm:p-6 shadow-[0_10px_30px_rgba(10,5,90,0.15)]";

function WalletContent() {
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
  const [usdtAmount, setUsdtAmount] = useState("10");
  const [fiatAmount, setFiatAmount] = useState("2000");
  const [loading, setLoading] = useState(false);
  const [fiatLoading, setFiatLoading] = useState(false);
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
  }, [searchParams]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">
          Wallet
        </h1>
        <p className="text-white/65 text-[13px] mt-1">
          Fund with Naira or USDT. One balance for everything.
        </p>
      </div>

      <div className={cardClass}>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--mu)]">
          Available balance
        </p>
        <p className="text-3xl font-black tracking-tight mt-1 tabular-nums">
          {balance === null ? "…" : formatNaira(balance)}
        </p>
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
          Fund with Naira
        </h2>
        <p className="text-[var(--mu)] text-[13px] mt-1 mb-4">
          Card, bank transfer, USSD via Paystack.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
              Amount (NGN)
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
              {fiatLoading ? "Redirecting…" : "Pay with Paystack"}
            </button>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-[15px] font-black uppercase tracking-tight">
          Fund with USDT
        </h2>
        <p className="text-[var(--mu)] text-[13px] mt-1 mb-4">
          Amount in <strong>USDT</strong> (USD). TRC20. Credited to your Naira
          wallet after confirmation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
              Amount (USDT)
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
              {loading ? "Creating invoice…" : "Pay with USDT"}
            </button>
          </div>
        </div>
        <p className="text-[var(--mu)] text-[11px] mt-3">
          Minimum <strong>10 USDT</strong> · Network TRC20 only
        </p>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-white mb-3">
            Pending deposits
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
                    Open invoice
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-white mb-3">
          Transaction history
        </h2>
        {ledger.length === 0 ? (
          <p className="text-white/60 text-[13px]">No transactions yet.</p>
        ) : (
          <div className="bg-white text-[var(--ink)] rounded-[18px] overflow-hidden shadow-[0_8px_20px_rgba(10,5,90,0.12)]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--ink)]/10 text-[var(--mu)] text-left">
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Amount</th>
                  <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">
                    Balance
                  </th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
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
  return (
    <Suspense
      fallback={
        <div className="text-white/60 text-[13px]">Loading wallet…</div>
      }
    >
      <WalletContent />
    </Suspense>
  );
}
