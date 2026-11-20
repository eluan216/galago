export function convertNgnKoboToCurrency(
  amountKobo: number,
  currencyCode: string,
  usdRates: Record<string, number>
) {
  const targetRate = usdRates[currencyCode];
  const ngnRate = usdRates.NGN;
  if (
    !Number.isSafeInteger(amountKobo) ||
    amountKobo < 0 ||
    !Number.isFinite(targetRate) ||
    targetRate <= 0 ||
    !Number.isFinite(ngnRate) ||
    ngnRate <= 0
  ) {
    return null;
  }

  const amount = (amountKobo / 100 / ngnRate) * targetRate;
  return Number.isFinite(amount) ? amount : null;
}

export function currencyFlag(countries: string[]) {
  const country = countries[0]?.toUpperCase();
  if (!country || !/^[A-Z]{2}$/.test(country)) return "";

  return String.fromCodePoint(
    ...[...country].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65)
  );
}
