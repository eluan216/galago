import "server-only";

const FRANKFURTER_API_BASE_URL = "https://api.frankfurter.dev/v2";
const RATE_CACHE_SECONDS = 3600;
const MAX_RATE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type CurrencyInfo = {
  code: string;
  name: string;
  symbol: string;
  symbol_native: string;
  decimal_digits: number;
  countries: string[];
};

type FrankfurterCurrency = {
  iso_code: string;
  name: string;
  symbol: string;
  type: string;
};

type FrankfurterRate = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

export type CurrencyRates = {
  updatedAt: string;
  usdRates: Record<string, number>;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${FRANKFURTER_API_BASE_URL}${path}`, {
    cache: "force-cache",
    next: { revalidate: RATE_CACHE_SECONDS },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Exchange-rate service returned HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

function getCurrencyRegion(code: string) {
  if (code.startsWith("X")) return [];
  const region = code.slice(0, 2);
  const regionName = new Intl.DisplayNames(["en"], { type: "region" }).of(region);
  return regionName && regionName !== region ? [region] : [];
}

function getDecimalDigits(code: string) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export async function getCurrencyCatalog(): Promise<CurrencyInfo[]> {
  const response = await request<FrankfurterCurrency[]>("/currencies");
  if (!Array.isArray(response)) {
    throw new Error("Exchange-rate service returned an invalid currency catalog");
  }

  return response
    .filter(
      (currency) =>
        currency.type === "currency" && /^[A-Z]{3}$/.test(currency.iso_code)
    )
    .map((currency) => ({
      code: currency.iso_code,
      name: currency.name,
      symbol: currency.symbol,
      symbol_native: currency.symbol,
      decimal_digits: getDecimalDigits(currency.iso_code),
      countries: getCurrencyRegion(currency.iso_code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getUsdRates(): Promise<CurrencyRates> {
  const response = await request<FrankfurterRate[]>("/rates?base=USD");
  if (!Array.isArray(response)) {
    throw new Error("Exchange-rate service returned invalid exchange rates");
  }

  const now = Date.now();
  const acceptedRates = response.filter((rate) => {
    const date = Date.parse(`${rate.date}T00:00:00Z`);
    const age = now - date;
    return (
      rate.base === "USD" &&
      /^[A-Z]{3}$/.test(rate.quote) &&
      Number.isFinite(rate.rate) &&
      rate.rate > 0 &&
      Number.isFinite(date) &&
      age >= -24 * 60 * 60 * 1000 &&
      age <= MAX_RATE_AGE_MS
    );
  });

  const usdRates: Record<string, number> = { USD: 1 };
  for (const rate of acceptedRates) {
    usdRates[rate.quote] = rate.rate;
  }
  if (!usdRates.NGN) {
    throw new Error("Exchange-rate service has no recent NGN reference rate");
  }

  const dates = acceptedRates.map((rate) => rate.date).sort();
  return {
    updatedAt: dates[0] || new Date().toISOString().slice(0, 10),
    usdRates,
  };
}
