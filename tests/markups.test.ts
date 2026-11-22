import test from "node:test";
import assert from "node:assert/strict";
import { PROVIDER_MARKUP, withMarkupKobo } from "../lib/markups";
import { providerPriceToNgnKobo } from "../lib/esim-pricing";

test("the resale markup is exactly 10%", () => {
  assert.equal(PROVIDER_MARKUP, 1.1);
});

test("whole-naira VTpass costs gain exactly 10% and no phantom kobo", () => {
  // ₦100.00 -> ₦110.00, ₦250.00 -> ₦275.00, ₦5,000.00 -> ₦5,500.00
  assert.equal(withMarkupKobo(10_000), 11_000);
  assert.equal(withMarkupKobo(25_000), 27_500);
  assert.equal(withMarkupKobo(500_000), 550_000);
});

test("VTpass costs with a partial kobo always round up, never down", () => {
  // ₦100.01 -> ₦110.011 -> 11,002 kobo (rounded up, not truncated)
  assert.equal(withMarkupKobo(10_001), 11_002);
  // ₦1,299.00 -> ₦1,428.90 exactly
  assert.equal(withMarkupKobo(129_900), 142_890);
  // ₦0.01 -> ₦0.011 -> 2 kobo
  assert.equal(withMarkupKobo(1), 2);
  assert.equal(withMarkupKobo(89), 98);
});

test("VTpass markup never charges less than 10% above cost", () => {
  for (const costKobo of [1, 7, 999, 10_000, 10_001, 129_937, 500_003]) {
    const charge = withMarkupKobo(costKobo);
    assert.ok(
      charge * 10 >= costKobo * 11,
      `charge ${charge} for cost ${costKobo} is under cost + 10%`
    );
    assert.ok(charge * 10 - costKobo * 11 < 10, "charge overshoots by a kobo or more");
  }
});

test("VTpass markup rejects non-positive or unsafe costs", () => {
  assert.equal(withMarkupKobo(0), 0);
  assert.equal(withMarkupKobo(-100), 0);
  assert.equal(withMarkupKobo(Number.MAX_SAFE_INTEGER), 0);
});

test("eSIM markup defaults to 10% without a phantom kobo", () => {
  // $1.00 at ₦1,500/$ -> ₦1,500.00 -> ₦1,650.00
  assert.equal(
    providerPriceToNgnKobo(10_000, "USD", { USD: 1, NGN: 1_500 }),
    165_000
  );
  // 1 EUR -> $1.1111... -> ₦1,666.67 -> ₦1,833.34 (rounded up)
  assert.equal(
    providerPriceToNgnKobo(10_000, "EUR", { USD: 1, EUR: 0.9, NGN: 1_500 }),
    183_334
  );
});
