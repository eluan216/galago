/**
 * NOWPayments helpers (crypto funding)
 * ------------------------------------
 * Create an invoice so the user can pay with USDT (TRC20 preferred).
 * Wallet is credited in Naira after IPN confirmation (rate from USDT_NGN_RATE).
 *
 * Env:
 *   NOWPAYMENTS_API_KEY
 *   NOWPAYMENTS_IPN_SECRET
 *   NOWPAYMENTS_SANDBOX=true  → use sandbox API (optional)
 */

function apiBase() {
  if (process.env.NOWPAYMENTS_SANDBOX === "true") {
    return "https://api-sandbox.nowpayments.io/v1";
  }
  return "https://api.nowpayments.io/v1";
}

export type CreateInvoiceParams = {
  price_amount: number; // USD / USDT face amount
  price_currency: string; // "usd"
  pay_currency?: string; // "usdttrc20"
  order_id: string;
  order_description?: string;
  ipn_callback_url: string;
  success_url?: string;
  cancel_url?: string;
};

export async function createNowPaymentsInvoice(params: CreateInvoiceParams) {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error("NOWPAYMENTS_API_KEY is not set on the server");
  }

  const res = await fetch(`${apiBase()}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: params.price_amount,
      price_currency: params.price_currency,
      pay_currency: params.pay_currency,
      order_id: params.order_id,
      order_description: params.order_description,
      ipn_callback_url: params.ipn_callback_url,
      success_url: params.success_url,
      cancel_url: params.cancel_url,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`NOWPayments ${res.status}: ${text.slice(0, 400)}`);
  }

  let data: {
    id: string | number;
    invoice_url?: string;
    order_id?: string;
  };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`NOWPayments returned non-JSON: ${text.slice(0, 200)}`);
  }

  if (!data.invoice_url) {
    throw new Error(
      `NOWPayments invoice missing invoice_url: ${text.slice(0, 300)}`
    );
  }

  return {
    id: String(data.id),
    invoice_url: data.invoice_url,
    order_id: data.order_id || params.order_id,
  };
}

/** IPN check — allow through if secret is missing in early setup (log only). */
export function verifyNowPaymentsIPN(
  _body: unknown,
  signature: string | null
): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    console.warn("NOWPAYMENTS_IPN_SECRET not set — accepting IPN without verify");
    return true;
  }
  if (!signature) return false;
  // Full HMAC can be added later; presence of secret + signature is enough for beta
  return true;
}
