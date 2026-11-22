import test from "node:test";
import assert from "node:assert/strict";
import { convertNgnKoboToCurrency } from "../lib/currency-format";
import { isOrderOutcomeUnknown, isProfileReady } from "../lib/esim-lifecycle";
import { providerPriceToNgnKobo } from "../lib/esim-pricing";

test("eSIM wholesale prices convert to NGN with the configured markup", () => {
  assert.equal(
    providerPriceToNgnKobo(10_000, "USD", { USD: 1, NGN: 1_500 }),
    165_000
  );
});

test("eSIM price conversion applies the source currency rate and rounds up", () => {
  assert.equal(
    providerPriceToNgnKobo(10_000, "EUR", { USD: 1, EUR: 0.9, NGN: 1_500 }),
    183_334
  );
});

test("eSIM price conversion rejects unsupported or unsafe provider prices", () => {
  assert.equal(
    providerPriceToNgnKobo(10_000, "XXX", { USD: 1, NGN: 1_500 }),
    null
  );
  assert.equal(
    providerPriceToNgnKobo(Number.MAX_SAFE_INTEGER + 1, "USD", {
      USD: 1,
      NGN: 1_500,
    }),
    null
  );
});

test("wallet display conversion changes the display value without changing kobo", () => {
  assert.equal(
    convertNgnKoboToCurrency(150_000, "USD", { USD: 1, NGN: 1_500 }),
    1
  );
  assert.equal(
    convertNgnKoboToCurrency(-1, "USD", { USD: 1, NGN: 1_500 }),
    null
  );
});

test("eSIM fulfilment requires an allocated and released profile", () => {
  assert.equal(
    isProfileReady({ esimStatus: "GOT_RESOURCE", smdpStatus: "RELEASED" }),
    true
  );
  assert.equal(
    isProfileReady({ esimStatus: "GOT_RESOURCE", smdpStatus: "DOWNLOAD" }),
    false
  );
  assert.equal(
    isProfileReady({ esimStatus: "IN_USE", smdpStatus: "ENABLED" }),
    false
  );
});

test("uncertain provider outcomes stay pending rather than trigger refunds", () => {
  assert.equal(isOrderOutcomeUnknown({ success: false, errorCode: "200010" }), true);
  assert.equal(isOrderOutcomeUnknown({ success: false, errorCode: 900001 }), true);
  assert.equal(isOrderOutcomeUnknown({ success: false, errorCode: "200007" }), false);
});
