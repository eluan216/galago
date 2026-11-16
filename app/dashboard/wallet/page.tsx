"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
  const [amount, setAmount] = useState("5000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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
      .limit(20);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Wallet</h1>
        <p className="text-mist text-sm mt-1">Fund with Naira or crypto (USDT)</p>
      </div>

      {/* Balance */}
      <div className="bg-bush border border-bush rounded-2xl p-6">
        <p className="text-mist text-sm">Available balance</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">
          {balance === null ? "…" : formatNaira(balance)}
        </p>
      </div>

      {/* Fund with Crypto */}
      <div className="bg-bush border border-bush rounded-2xl p-6">
        <h2 className="font-medium mb-1">Fund with Crypto (USDT)</h2>
        <p className="text-mist text-sm mb-4">
          Send USDT on TRC20. We convert and credit your Naira wallet.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
            {message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm text-mist mb-1.5">Amount (NGN)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1000}
              step={500}
              className="w-full bg-night border border-mist/20 rounded-xl px-4 py-3 text-moon focus:outline-none focus:border-gold/60 transition"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCryptoFund}
              disabled={loading}
              className="w-full sm:w-auto bg-gold text-night font-semibold px-6 py-3 rounded-xl hover:bg-gold-glow transition disabled:opacity-60"
            >
              {loading ? "Creating invoice…" : "Pay with USDT"}
            </button>
          </div>
        </div>
        <p className="text-mist text-xs mt-3">
          Minimum ₦1,000. Network: TRC20 (low fees). Do not send other coins or networks.
        </p>
      </div>

      {/* Pending crypto deposits */}
      {deposits.filter((d) => d.status === "pending" || d.status === "confirming").length > 0 && (
        <div>
          <h2 className="font-medium mb-3">Pending deposits</h2>
          <div className="space-y-2">
            {deposits
              .filter((d) => d.status === "pending" || d.status === "confirming")
              .map((d) => (
                <div
                  key={d.id}
                  className="bg-bush border border-bush rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm">
                      {d.amount_ngn_kobo ? formatNaira(d.amount_ngn_kobo) : "—"} · {d.network}
                    </p>
                    <p className="text-mist text-xs capitalize">{d.status}</p>
                  </div>
                  {d.pay_url && (
                    <a
                      href={d.pay_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold text-sm hover:underline"
                    >
                      Open invoice
                    </a>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Ledger */}
      <div>
        <h2 className="font-medium mb-3">Transaction history</h2>
        {ledger.length === 0 ? (
          <p className="text-mist text-sm">No transactions yet.</p>
        ) : (
          <div className="bg-bush border border-bush rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-night text-mist text-left">
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((e) => (
                  <tr key={e.id} className="border-b border-night/50 last:border-0">
                    <td className="px-4 py-3 capitalize">{e.type.replace("_", " ")}</td>
                    <td
                      className={`px-4 py-3 font-mono ${
                        e.amount_kobo >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {e.amount_kobo >= 0 ? "+" : ""}
                      {formatNaira(e.amount_kobo)}
                    </td>
                    <td className="px-4 py-3 text-mist">
                      {formatNaira(e.balance_after_kobo)}
                    </td>
                    <td className="px-4 py-3 text-mist">
                      {new Date(e.created_at).toLocaleString()}
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