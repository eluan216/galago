import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyNowPaymentsIPN } from "../lib/crypto/nowpayments";

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

test("NOWPayments IPN accepts a valid HMAC-SHA512 signature", () => {
  process.env.NOWPAYMENTS_IPN_SECRET = "test-secret";
  const body = {
    order_id: "deposit-123",
    payment_status: "finished",
    pay_amount: "10",
  };
  const signature = createHmac("sha512", "test-secret")
    .update(JSON.stringify(sortObjectKeys(body)))
    .digest("hex");

  assert.equal(verifyNowPaymentsIPN(body, signature), true);
});

test("NOWPayments IPN rejects missing or invalid signatures", () => {
  process.env.NOWPAYMENTS_IPN_SECRET = "test-secret";
  const body = { order_id: "deposit-123", payment_status: "finished" };

  assert.equal(verifyNowPaymentsIPN(body, null), false);
  assert.equal(verifyNowPaymentsIPN(body, "invalid"), false);
});
