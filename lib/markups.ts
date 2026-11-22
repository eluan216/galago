/** Galago resells every provider-funded product at the provider's cost + 10%. */

export const PROVIDER_MARKUP = 1.1;
export const PROVIDER_MARKUP_PERCENT = 10;

/** VTpass cost in kobo → what the customer is charged, rounded up to a kobo. */
export function withMarkupKobo(costKobo: number) {
  if (!Number.isSafeInteger(costKobo) || costKobo <= 0) return 0;
  // Integer arithmetic keeps a whole-kobo cost (e.g. ₦100) from gaining a
  // phantom kobo when the ×1.1 result is a hair above an integer in floating
  // point. A partial kobo still rounds up.
  const charge = Math.ceil((costKobo * 11) / 10);
  return Number.isSafeInteger(charge) ? charge : 0;
}
