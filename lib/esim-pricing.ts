export function providerPriceToNgnKobo(
  priceUnits: number,
  currencyCode: string,
  usdRates: Record<string, number>,
  markupPercent = 7
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
  const amountKobo = Math.ceil(amountNgn * (1 + markupPercent / 100) * 100);
  return Number.isSafeInteger(amountKobo) ? amountKobo : null;
}
