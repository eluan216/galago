/**
 * NOWPayments integration stub for Galago crypto deposits.
 * Docs: https://nowpayments.io/api
 */

const NOWPAYMENTS_API = "https://api.nowpayments.io/v1";

export type CreateInvoiceParams = {
  price_amount: number; // in USD or the fiat you choose
  price_currency: string; // "usd" or "ngn"
  pay_currency?: string; // "usdttrc20" preferred
  order_id: string; // our crypto_deposits.id
  order_description?: string;
  ipn_callback_url: string;
  success_url?: string;
  cancel_url?: string;
};

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
    // ... other fields
  }>;
}

export function verifyNowPaymentsIPN(
  body: unknown,
  signature: string | null
): boolean {
  // TODO: implement HMAC verification with NOWPAYMENTS_IPN_SECRET
  // See: https://documenter.getpostman.com/view/7907941/S1a32n38#invoice-payment
  if (!signature || !process.env.NOWPAYMENTS_IPN_SECRET) return false;
  // Placeholder — implement proper check before production
  return true;
}