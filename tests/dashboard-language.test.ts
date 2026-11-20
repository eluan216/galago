import test from "node:test";
import assert from "node:assert/strict";
import {
  isDashboardLocale,
  translate,
} from "../lib/dashboard-language";

test("dashboard language validation accepts the supported locales only", () => {
  assert.equal(isDashboardLocale("yo"), true);
  assert.equal(isDashboardLocale("ig"), true);
  assert.equal(isDashboardLocale("ha"), true);
  assert.equal(isDashboardLocale("fr"), false);
  assert.equal(isDashboardLocale(null), false);
});

test("dashboard translations fall back to English for untranslated labels", () => {
  assert.equal(translate("yo", "Overview"), "Akopọ");
  assert.equal(translate("ig", "Wallet"), "Akpa ego");
  assert.equal(translate("ha", "Orders"), "Oda");
  assert.equal(translate("ha", "Unknown label"), "Unknown label");
  assert.equal(translate("en", "Overview"), "Overview");
});
