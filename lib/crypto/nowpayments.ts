import { createHmac, timingSafeEqual } from "crypto";

/**
 * NOWPayments helpers — multi-coin wallet funding.
 * Invoice price is USD; pay_currency is the coin the user selected.
 *
 * Env:
 *   NOWPAYMENTS_API_KEY
 *   NOWPAYMENTS_IPN_SECRET
 *   NOWPAYMENTS_SANDBOX=true  → sandbox API
 */

function apiBase() {
  if (process.env.NOWPAYMENTS_SANDBOX === "true") {
    return "https://api-sandbox.nowpayments.io/v1";
  }
  return "https://api.nowpayments.io/v1";
}

export type CreateInvoiceParams = {
  /** USD face amount the deposit is worth */
  price_amount: number;
  price_currency: string; // "usd"
  /** NOWPayments ticker, e.g. usdttrc20, btc, eth */
  pay_currency?: string;
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

  const payload: Record<string, unknown> = {
    price_amount: params.price_amount,
    price_currency: params.price_currency,
    order_id: params.order_id,
    order_description: params.order_description,
    ipn_callback_url: params.ipn_callback_url,
    success_url: params.success_url,
    cancel_url: params.cancel_url,
  };
  if (params.pay_currency) {
    payload.pay_currency = params.pay_currency;
  }

  const res = await fetch(`${apiBase()}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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

/** Verify NOWPayments IPN using the provider HMAC-SHA512 signature. */
export function verifyNowPaymentsIPN(
  body: unknown,
  signature: string | null
): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    console.error("NOWPAYMENTS_IPN_SECRET not set — rejecting IPN");
    return false;
  }
  if (!signature) return false;
  if (!body || typeof body !== "object") return false;

  const sorted = JSON.stringify(sortObjectKeys(body as Record<string, unknown>));
  const expected = createHmac("sha512", secret).update(sorted).digest("hex");
  const supplied = Buffer.from(signature.trim().toLowerCase(), "utf8");
  const expectedBuffer = Buffer.from(expected.toLowerCase(), "utf8");
  return (
    supplied.length === expectedBuffer.length &&
    timingSafeEqual(supplied, expectedBuffer)
  );
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((sorted, key) => {
      sorted[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
      return sorted;
    }, {});
}
