"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PROVIDER_MARKUP } from "@/lib/markups";
import { useDashboardLanguage } from "@/components/DashboardLanguageProvider";
import { translate } from "@/lib/dashboard-language";

type Category = { identifier: string; name: string };
type Product = {
  serviceID: string;
  name: string;
  minimum_amount?: string;
  maximum_amount?: string;
  product_type?: string;
};
type Variation = {
  variation_code: string;
  name: string;
  variation_amount: string;
};
type Purchase = {
  id: string;
  request_id: string;
  category: string;
  service_name: string;
  product_name: string;
  customer_reference: string;
  amount_kobo: number;
  status: "pending" | "delivered" | "failed";
  purchased_code: string | null;
  created_at: string;
};

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}

const inputClass =
  "w-full bg-[var(--of)] border-2 border-[var(--ink)]/15 rounded-xl px-3.5 py-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--bl)] transition";
const cardClass =
  "bg-white text-[var(--ink)] rounded-[22px] p-5 sm:p-6 shadow-[0_10px_30px_rgba(10,5,90,0.15)]";

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

export default function BillsPage() {
  const locale = useDashboardLanguage();
  const t = (source: string) => translate(locale, source);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [transactions, setTransactions] = useState<Purchase[]>([]);
  const [category, setCategory] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [variationCode, setVariationCode] = useState("");
  const [phone, setPhone] = useState("");
  const [customerReference, setCustomerReference] = useState("");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [verifiedName, setVerifiedName] = useState("");
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  const selectedProduct = products.find((item) => item.serviceID === serviceId);
  const selectedVariation = variations.find(
    (item) => item.variation_code === variationCode
  );
  const needsAccountVerification =
    category === "electricity-bill" || category === "tv-subscription";
  const usesVariation =
    category === "data" ||
    category === "tv-subscription" ||
    category === "education";
  const amountKobo = useMemo(() => {
    if (usesVariation && selectedVariation) {
      return Math.round(Number(selectedVariation.variation_amount) * 100) * quantity;
    }
    return Math.round(Number(amount) * 100) || 0;
  }, [amount, quantity, selectedVariation, usesVariation]);
  // VTpass is paid the cost above; the customer pays cost + 10%.
  const chargeKobo = useMemo(
    () => (amountKobo > 0 ? Math.ceil(amountKobo * PROVIDER_MARKUP) : 0),
    [amountKobo]
  );

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [catalogResponse, supabase] = await Promise.all([
          fetch("/api/vtpass/catalog"),
          Promise.resolve(createClient()),
        ]);
        const catalog = await responseJson(catalogResponse);
        if (!catalogResponse.ok) throw new Error(String(catalog.error || "Could not load VTPass services"));
        if (!active) return;
        setCategories((catalog.categories || []) as Category[]);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const [{ data: wallet }, { data: history }] = await Promise.all([
            supabase
              .from("wallets")
              .select("balance_kobo")
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("vtpass_transactions")
              .select(
                "id, request_id, category, service_name, product_name, customer_reference, amount_kobo, status, purchased_code, created_at"
              )
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(10),
          ]);
          if (active) {
            setBalance(wallet?.balance_kobo ?? 0);
            setTransactions((history || []) as Purchase[]);
          }
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load services");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!category) return;
    let active = true;
    setProductsLoading(true);
    setProducts([]);
    setVariations([]);
    setServiceId("");
    setVariationCode("");
    setVerifiedName("");
    fetch(`/api/vtpass/catalog?category=${encodeURIComponent(category)}`)
      .then(responseJson)
      .then((data) => {
        if (!active) return;
        if (data.error) throw new Error(String(data.error));
        setProducts((data.products || []) as Product[]);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load products");
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category]);

  useEffect(() => {
    if (!serviceId || !usesVariation) {
      setVariations([]);
      setVariationCode("");
      return;
    }
    let active = true;
    setProductsLoading(true);
    setVariations([]);
    setVariationCode("");
    fetch(
      `/api/vtpass/catalog?category=${encodeURIComponent(category)}&service_id=${encodeURIComponent(serviceId)}`
    )
      .then(responseJson)
      .then((data) => {
        if (!active) return;
        if (data.error) throw new Error(String(data.error));
        setVariations((data.variations || []) as Variation[]);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load plans");
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, serviceId, usesVariation]);

  async function refreshHistory() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("vtpass_transactions")
      .select(
        "id, request_id, category, service_name, product_name, customer_reference, amount_kobo, status, purchased_code, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setTransactions((data || []) as Purchase[]);
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance_kobo")
      .eq("user_id", user.id)
      .maybeSingle();
    setBalance(wallet?.balance_kobo ?? 0);
  }

  async function verifyAccount() {
    if (!selectedProduct || !customerReference) return;
    setVerifyLoading(true);
    setError(null);
    setMessage(null);
    setVerifiedName("");
    try {
      const response = await fetch("/api/vtpass/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          service_id: serviceId,
          billers_code: customerReference,
          type: category === "electricity-bill" ? meterType : undefined,
        }),
      });
      const data = await responseJson(response);
      if (!response.ok) throw new Error(String(data.error || "Could not verify account"));
      setVerifiedName(String(data.customer_name || "Verified account"));
      setMessage("Account verified. Confirm the details before paying.");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Could not verify account");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function submitPurchase(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedProduct) return;
    if (needsAccountVerification && !verifiedName) {
      setError("Verify the account before purchasing.");
      return;
    }
    if (usesVariation && !selectedVariation) {
      setError("Choose a plan.");
      return;
    }

    setPurchaseLoading(true);
    setError(null);
    setMessage(null);
    const key = idempotencyKey || crypto.randomUUID();
    setIdempotencyKey(key);
    try {
      const response = await fetch("/api/vtpass/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({
          category,
          service_id: serviceId,
          variation_code: variationCode || undefined,
          phone,
          customer_reference: customerReference || undefined,
          meter_type: category === "electricity-bill" ? meterType : undefined,
          amount_ngn: usesVariation ? undefined : amount,
          quantity: category === "education" ? quantity : 1,
        }),
      });
      const data = await responseJson(response);
      if (!response.ok && response.status !== 202) {
        throw new Error(String(data.error || "Purchase failed"));
      }
      const status = String(data.status || "pending");
      setMessage(
        status === "delivered"
          ? `Purchase delivered. ${data.purchased_code ? `Code: ${data.purchased_code}` : ""}`
          : status === "failed"
            ? "VTPass could not complete the purchase. The wallet debit has been refunded."
            : "Purchase is processing. Check its status before trying again."
      );
      if (status !== "pending") setIdempotencyKey("");
      await refreshHistory();
    } catch (purchaseError) {
      setError(purchaseError instanceof Error ? purchaseError.message : "Purchase failed");
    } finally {
      setPurchaseLoading(false);
    }
  }

  async function checkStatus(transactionId: string) {
    setStatusLoading(transactionId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/vtpass/transactions/${transactionId}/status`,
        { method: "POST" }
      );
      const data = await responseJson(response);
      if (!response.ok) throw new Error(String(data.error || "Could not check status"));
      setMessage(
        data.status === "delivered"
          ? `Purchase delivered. ${data.purchased_code ? `Code: ${data.purchased_code}` : ""}`
          : data.status === "failed"
            ? "Purchase failed. The wallet debit has been refunded."
            : "Still processing at VTPass. Check again shortly."
      );
      if (data.status !== "pending") setIdempotencyKey("");
      await refreshHistory();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not check status");
    } finally {
      setStatusLoading(null);
    }
  }

  const canPurchase =
    !loading &&
    !productsLoading &&
    !purchaseLoading &&
    !!selectedProduct &&
    !!phone &&
    amountKobo > 0 &&
    (!usesVariation || !!selectedVariation) &&
    (!needsAccountVerification || !!verifiedName);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-white/60 text-[12px] font-semibold hover:text-[var(--li)]"
        >
          {t("← Overview")}
        </Link>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white mt-2">
          {t("Airtime & bills")}
        </h1>
        <p className="text-white/65 text-[13px] mt-1">
          {t("VTpass services · wallet balance")}{" "}
          {balance === null ? "…" : formatNaira(balance)}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 text-[13px]">
          {error}
          {error.toLowerCase().includes("credential") && (
            <p className="mt-1">
              Add VTPASS_API_KEY, VTPASS_PUBLIC_KEY, VTPASS_SECRET_KEY, and set
              VTPASS_ENVIRONMENT=sandbox.
            </p>
          )}
        </div>
      )}
      {message && (
        <div role="status" className="rounded-xl bg-[var(--li)]/30 border border-[var(--li)] text-[var(--ink)] px-3.5 py-2.5 text-[13px] font-medium">
          {message}
        </div>
      )}

      <form onSubmit={submitPurchase} className={`${cardClass} space-y-4`}>
        <div>
          <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
            {t("Service type")}
          </label>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setError(null);
              setMessage(null);
              setAmount("");
              setCustomerReference("");
            }}
            required
            className={inputClass}
          >
            <option value="">{t("Choose a service")}</option>
            {categories.map((item) => (
              <option key={item.identifier} value={item.identifier}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {!!category && (
          <div>
            <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
              {t("Provider")}
            </label>
            <select
              value={serviceId}
              onChange={(event) => {
                setServiceId(event.target.value);
                setVerifiedName("");
                setVariationCode("");
              }}
              required
              disabled={productsLoading}
              className={inputClass}
            >
              <option value="">
                {productsLoading ? t("Loading providers…") : t("Choose provider")}
              </option>
              {products.map((item) => (
                <option key={item.serviceID} value={item.serviceID}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {serviceId && usesVariation && (
          <div>
            <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
              {t("Plan")}
            </label>
            <select
              value={variationCode}
              onChange={(event) => setVariationCode(event.target.value)}
              required
              disabled={productsLoading}
              className={inputClass}
            >
              <option value="">
                {productsLoading ? t("Loading plans…") : t("Choose plan")}
              </option>
              {variations.map((item) => (
                <option key={item.variation_code} value={item.variation_code}>
                  {item.name} · {formatNaira(Math.round(Number(item.variation_amount) * 100))}
                </option>
              ))}
            </select>
          </div>
        )}

        {category === "electricity-bill" && serviceId && (
          <div>
            <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
              {t("Meter type")}
            </label>
            <select
              value={meterType}
              onChange={(event) => {
                setMeterType(event.target.value as "prepaid" | "postpaid");
                setVerifiedName("");
              }}
              className={inputClass}
            >
              <option value="prepaid">{t("Prepaid")}</option>
              <option value="postpaid">{t("Postpaid")}</option>
            </select>
          </div>
        )}

        {serviceId && (
          <>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
                {t("Recipient phone number")}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                maxLength={14}
                placeholder="08012345678"
                className={inputClass}
              />
            </div>

            {needsAccountVerification && (
              <div>
                <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
                  {t(category === "electricity-bill" ? "Meter number" : "Smartcard / decoder number")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customerReference}
                    onChange={(event) => {
                      setCustomerReference(event.target.value);
                      setVerifiedName("");
                    }}
                    required
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={verifyAccount}
                    disabled={verifyLoading || !customerReference}
                    className="shrink-0 rounded-full border-2 border-[var(--ink)] px-4 text-[11px] font-bold uppercase disabled:opacity-50"
                  >
                    {verifyLoading ? "…" : t("Verify")}
                  </button>
                </div>
                {verifiedName && (
                  <p className="mt-2 text-[12px] text-emerald-700 font-semibold">
                    {t("Verified:")} {verifiedName}
                  </p>
                )}
              </div>
            )}

            {(category === "airtime" || category === "electricity-bill") && (
              <div>
                <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
                  {t("Amount (NGN)")}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            )}

            {category === "education" && (
              <div>
                <label className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5">
                  {t("Number of PINs")}
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className={inputClass}
                />
              </div>
            )}
          </>
        )}

        {selectedProduct && (
          <div className="bg-[var(--of)] border-2 border-[var(--ink)]/10 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-[var(--mu)] text-[13px] font-semibold">
              {t("Charge · VTpass + 10%")}
            </span>
            <span className="text-lg font-black tabular-nums">
              {chargeKobo > 0 ? formatNaira(chargeKobo) : "—"}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={!canPurchase}
          className="btn-galago w-full disabled:opacity-50"
        >
          {purchaseLoading ? t("Submitting…") : t("Pay from wallet")}
        </button>
        <p className="text-[var(--mu)] text-[11px] text-center leading-relaxed">
          {t("Payment is deducted when submitted. If VTpass confirms failure, the wallet is refunded. Pending transactions must be checked before retrying.")}
        </p>
      </form>

      <section>
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-white mb-3">
          {t("Recent VTpass purchases")}
        </h2>
        {loading ? (
          <p className="text-white/60 text-[13px]">{t("Loading…")}</p>
        ) : transactions.length === 0 ? (
          <p className="text-white/60 text-[13px]">{t("No VTpass purchases yet.")}</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <article
                key={transaction.id}
                className="bg-white text-[var(--ink)] rounded-[16px] p-4 shadow-[0_8px_20px_rgba(10,5,90,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-[13px]">{transaction.product_name}</p>
                    <p className="text-[var(--mu)] text-[11px] mt-1 break-all">
                      {transaction.service_name} · {transaction.customer_reference}
                    </p>
                    <p className="text-[var(--mu)] text-[11px] mt-1">
                      {transaction.request_id} · {formatNaira(transaction.amount_kobo)}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold uppercase">{t(transaction.status)}</span>
                </div>
                {transaction.purchased_code && (
                  <p className="mt-3 rounded-lg bg-[var(--of)] p-3 text-[12px] font-mono break-all">
                    {transaction.purchased_code}
                  </p>
                )}
                {transaction.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => checkStatus(transaction.id)}
                    disabled={statusLoading === transaction.id}
                    className="mt-3 text-[11px] font-bold uppercase text-[var(--bl)] hover:underline disabled:opacity-50"
                  >
                    {statusLoading === transaction.id ? t("Checking…") : t("Check status")}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
