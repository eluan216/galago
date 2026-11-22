/**
 * Supported pay currencies for NOWPayments wallet funding.
 * price is always set in USD; user pays in the chosen coin; Galago credits NGN.
 */

export type CryptoPayOption = {
  /** Value stored on deposit + sent as NOWPayments pay_currency */
  id: string;
  /** Short ticker for UI */
  ticker: string;
  /** Human label */
  label: string;
  /** Network hint shown in UI */
  network: string;
};

/** Curated list — common, liquid coins NOWPayments accepts on most accounts. */
export const CRYPTO_PAY_OPTIONS: CryptoPayOption[] = [
  {
    id: "usdttrc20",
    ticker: "USDT",
    label: "USDT (TRC20)",
    network: "TRC20",
  },
  {
    id: "usdterc20",
    ticker: "USDT",
    label: "USDT (ERC20)",
    network: "ERC20",
  },
  {
    id: "btc",
    ticker: "BTC",
    label: "Bitcoin",
    network: "Bitcoin",
  },
  {
    id: "eth",
    ticker: "ETH",
    label: "Ethereum",
    network: "ERC20",
  },
  {
    id: "ltc",
    ticker: "LTC",
    label: "Litecoin",
    network: "Litecoin",
  },
  {
    id: "sol",
    ticker: "SOL",
    label: "Solana",
    network: "Solana",
  },
  {
    id: "bnbbsc",
    ticker: "BNB",
    label: "BNB (BSC)",
    network: "BEP20",
  },
  {
    id: "trx",
    ticker: "TRX",
    label: "TRON",
    network: "TRC20",
  },
];

export function findPayOption(id: string | null | undefined) {
  if (!id) return null;
  const key = id.trim().toLowerCase();
  return CRYPTO_PAY_OPTIONS.find((o) => o.id === key) || null;
}

export const MIN_USD_DEPOSIT = 10;
