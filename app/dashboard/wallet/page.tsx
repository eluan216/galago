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
  status: string;
  pay_url: string | null;
  created_at: string;
};

const inputClass =
  "w-full bg-night border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[14px] text-moon placeholder:text-mist/50 focus:outline-none focus:border-gold/40 transition";
const cardClass =
  "bg-surface border border-white/[0.06] rounded-card p-5 sm:p-6";

function WalletContent() {
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
  const [amount, setAmount] = useState("5000");
  const [fiatAmount, setFiatAmount] = useState("2000");
  const [loading, setLoading] = useState(false);
  const [fiatLoading, setFiatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("deposit") === "success") {
      setMessage("Deposit successful. Balance updated.");
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
      .select("id, network, amount_ngn_kobo, status, pay_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setDeposits(crypto || []);
  }

  async function handleCryptoFund() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const ngn = Number(amount);
    if (!ngn || ngn < 1000) {
      setError("Minimum is ₦1,000");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/crypto/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_ngn: ngn, network: "TRC20" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create invoice");
        setLoading(false);
        return;
      }

      if (data.pay_url) {
        window.location.href = data.pay_url;
      } else {
        setMessage("Invoice created. Refresh to see status.");
        loadData();
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-moon">Wallet</h1>
        <p className="text-mist text-[13px] mt-1">
          Fund with Naira or USDT. One balance for everything.
        </p>
      </div>

      {/* Balance — hero number */}
      <div className={cardClass}>
        <p className="text-mist text-[12px] tracking-wide">Available balance</p>
        <p className="text-3xl font-semibold tracking-tight text-moon mt-1 tabular-nums">
          {balance === null ? "…" : formatNaira(balance)}
        </p>
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-[13px]">
          {error}
        </div>
      )}
      {message && (
        <div className="px-3.5 py-2.5 rounded-lg bg-success/10 border border-success/20 text-success text-[13px]">
          {message}
        </div>
      )}

      {/* Fiat */}
      <div className={cardClass}>
        <h2 className="text-[15px] font-medium text-moon">Fund with Naira</h2>
        <p className="text-mist text-[13px] mt-1 mb-4">
          Card, bank transfer, USSD via Paystack.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[12px] text-mist mb-1.5">Amount (NGN)</label>
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
              className="w-full sm:w-auto bg-gold text-night text-[13px] font-semibold px-5 py-2.5 rounded-full hover:brightness-110 transition disabled:opacity-50"
            >
              {fiatLoading ? "Redirecting…" : "Pay with Paystack"}
            </button>
          </div>
        </div>
      </div>

      {/* Crypto */}
      <div className={cardClass}>
        <h2 className="text-[15px] font-medium text-moon">Fund with USDT</h2>
        <p className="text-mist text-[13px] mt-1 mb-4">
          TRC20 preferred. We convert and credit Naira.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[12px] text-mist mb-1.5">Amount (NGN)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1000}
              step={500}
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCryptoFund}
              disabled={loading}
              className="w-full sm:w-auto border border-white/[0.12] text-moon text-[13px] font-medium px-5 py-2.5 rounded-full hover:border-gold/40 hover:text-gold transition disabled:opacity-50"
            >
              {loading ? "Creating invoice…" : "Pay with USDT"}
            </button>
          </div>
        </div>
        <p className="text-mist text-[11px] mt-3">Minimum ₦1,000 · Network TRC20 only</p>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-[13px] font-medium text-moon mb-3">Pending deposits</h2>
          <div className="space-y-2">
            {pending.map((d) => (
              <div
                key={d.id}
                className="bg-surface border border-white/[0.06] rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-[13px] text-moon tabular-nums">
                    {d.amount_ngn_kobo ? formatNaira(d.amount_ngn_kobo) : "—"}
                    <span className="text-mist"> · {d.network}</span>
                  </p>
                  <p className="text-mist text-[11px] capitalize mt-0.5">{d.status}</p>
                </div>
                {d.pay_url && (
                  <a
                    href={d.pay_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold text-[12px] hover:underline"
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
        <h2 className="text-[13px] font-medium text-moon mb-3">Transaction history</h2>
        {ledger.length === 0 ? (
          <p className="text-mist text-[13px]">No transactions yet.</p>
        ) : (
          <div className="bg-surface border border-white/[0.06] rounded-card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-mist text-left">
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Balance</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-4 py-2.5 capitalize text-moon">
                      {e.type.replace(/_/g, " ")}
                    </td>
                    <td
                      className={`px-4 py-2.5 font-mono tabular-nums ${
                        e.amount_kobo >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {e.amount_kobo >= 0 ? "+" : ""}
                      {formatNaira(e.amount_kobo)}
                    </td>
                    <td className="px-4 py-2.5 text-mist tabular-nums hidden sm:table-cell">
                      {formatNaira(e.balance_after_kobo)}
                    </td>
                    <td className="px-4 py-2.5 text-mist">
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
    <Suspense fallback={<div className="text-mist text-[13px]">Loading wallet…</div>}>
      <WalletContent />
    </Suspense>
  );
}
