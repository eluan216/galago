import { PROVIDER_MARKUP_PERCENT } from "./markups";

export function providerPriceToNgnKobo(
  priceUnits: number,
  currencyCode: string,
  usdRates: Record<string, number>,
  markupPercent = PROVIDER_MARKUP_PERCENT
) {
  const sourceRate = usdRates[currencyCode];
  const ngnRate = usdRates.NGN;
  if (
    !Number.isSafeInteger(priceUnits) ||
    priceUnits <= 0 ||
    !Number.isFinite(sourceRate) ||
    sourceRate <= 0 ||
    !Number.isFinite(ngnRate) ||
    ngnRate <= 0 ||
    !Number.isFinite(markupPercent) ||
    markupPercent < 0
  ) {
    return null;
  }

  const sourceAmount = priceUnits / 10_000;
  const amountNgn = (sourceAmount / sourceRate) * ngnRate;
  // Subtract a negligible epsilon so a value that is mathematically whole
  // (e.g. ₦1,500 × 1.10) does not gain a kobo from floating-point error.
  const amountKobo = Math.ceil(
    amountNgn * (1 + markupPercent / 100) * 100 - 1e-9
  );
  return Number.isSafeInteger(amountKobo) ? amountKobo : null;
}
