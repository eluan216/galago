/**
 * Paystack helpers (fiat funding)
 * ------------------------------
 * Initialize a payment and verify a completed transaction.
 * Amounts are always in kobo (1 NGN = 100 kobo).
 *
 * Env required: PAYSTACK_SECRET_KEY
 */

const PAYSTACK_API = "https://api.paystack.co";

/**
 * Start a Paystack transaction and return the authorization URL the user should visit.
 */
export async function initializePaystackTransaction(params: {
  email: string;
  amount_kobo: number;
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not set");

  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount_kobo, // Paystack expects kobo
      reference: params.reference,
      callback_url: params.callback_url,
      metadata: params.metadata,
      channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack initialize error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.data as {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Verify that a Paystack transaction was successful (call after redirect or webhook).
 */
export async function verifyPaystackTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not set");

  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack verify error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.data as {
    status: string;
    amount: number;
    reference: string;
    paid_at: string | null;
    metadata: Record<string, unknown>;
  };
}
