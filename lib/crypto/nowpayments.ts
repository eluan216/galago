/**
 * NOWPayments helpers (crypto funding)
 * ------------------------------------
 * Create an invoice so the user can pay with USDT (or other coins).
 * On success we credit the Naira wallet via the webhook handler.
 *
 * Env required:
 *   NOWPAYMENTS_API_KEY
 *   NOWPAYMENTS_IPN_SECRET (for webhook signature verification)
 *
 * Preferred network in Nigeria: USDT-TRC20 (low fees).
 */

const NOWPAYMENTS_API = "https://api.nowpayments.io/v1";

export type CreateInvoiceParams = {
  price_amount: number; // amount in the price currency (e.g. USD)
  price_currency: string; // "usd" or "ngn"
  pay_currency?: string; // e.g. "usdttrc20"
  order_id: string; // our crypto_deposits.id — returned in the webhook
  order_description?: string;
  ipn_callback_url: string; // webhook URL
  success_url?: string;
  cancel_url?: string;
};

/** Create a NOWPayments invoice and return the payment page URL. */
export async function createNowPaymentsInvoice(params: CreateInvoiceParams) {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error("NOWPAYMENTS_API_KEY is not set");

  const res = await fetch(`${NOWPAYMENTS_API}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NOWPayments invoice error: ${res.status} ${text}`);
  }

  return res.json() as Promise<{
    id: string;
    invoice_url: string;
    order_id: string;
  }>;
}

/**
 * Verify the IPN (webhook) signature from NOWPayments.
 * TODO: implement full HMAC check with NOWPAYMENTS_IPN_SECRET before production traffic.
 */
export function verifyNowPaymentsIPN(
  body: unknown,
  signature: string | null
): boolean {
  if (!signature || !process.env.NOWPAYMENTS_IPN_SECRET) return false;
  // Placeholder — replace with real HMAC verification
  return true;
}
