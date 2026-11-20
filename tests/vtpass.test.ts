import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyTransaction,
  createVtpassRequestId,
  isProductionPurchaseDisabled,
  isVerificationSuccess,
  ngnToKobo,
} from "../lib/vtpass";

test("VTpass request IDs start with Lagos local date and time", () => {
  const requestId = createVtpassRequestId(new Date("2026-11-20T10:00:00.000Z"));

  assert.match(requestId, /^202611201100[a-f0-9]{12}$/);
});

test("VTpass amounts are converted to safe integer kobo", () => {
  assert.equal(ngnToKobo("1250.50"), 125050);
  assert.equal(ngnToKobo("10.001"), null);
  assert.equal(ngnToKobo("-1"), null);
});

test("sandbox VTpass purchases are blocked only in production", () => {
  assert.equal(isProductionPurchaseDisabled("production", "sandbox"), true);
  assert.equal(isProductionPurchaseDisabled("production", undefined), true);
  assert.equal(isProductionPurchaseDisabled("production", "live"), false);
  assert.equal(isProductionPurchaseDisabled("preview", "sandbox"), false);
});

test("VTpass transaction responses remain pending unless terminal", () => {
  assert.equal(
    classifyTransaction({
      code: "000",
      content: { transactions: { status: "delivered" } },
    }),
    "delivered"
  );
  assert.equal(classifyTransaction({ code: "016" }), "failed");
  assert.equal(
    classifyTransaction({ code: "000", content: { transactions: { status: "pending" } } }),
    "pending"
  );
  assert.equal(classifyTransaction({ code: "unexpected" }), "pending");
});

test("VTpass verification accepts only confirmed response codes", () => {
  assert.equal(isVerificationSuccess({ code: "020" }), true);
  assert.equal(isVerificationSuccess({ code: "000" }), true);
  assert.equal(isVerificationSuccess({ code: "030" }), false);
});
