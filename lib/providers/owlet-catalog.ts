/**
 * Owlet catalogue → Galago catalog.
 *
 * Owlet quotes `rate` in USD per 1,000 units. Galago sells per unit in kobo at
 * Owlet's rate + 10%, rounded UP at 4 decimals so no rounding step can ever
 * price a service below Owlet's cost + markup.
 */

export const OWLET_MARKUP = 1.1;

/** Only plain "Default" services take the key/service/link/quantity call that
 *  owletAddOrder() sends. Comment, mention and poll services need extra
 *  fields, so listing them would offer orders the provider rejects. */
const ORDERABLE_TYPE = "default";

const PLATFORM_ALIASES: Record<string, string> = {
  instagram: "Instagram",
  ig: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  yt: "YouTube",
  twitter: "X (Twitter)",
  x: "X (Twitter)",
  telegram: "Telegram",
  tg: "Telegram",
  facebook: "Facebook",
  fb: "Facebook",
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  twitch: "Twitch",
  kick: "Kick",
  discord: "Discord",
  threads: "Threads",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  reddit: "Reddit",
  snapchat: "Snapchat",
  whatsapp: "WhatsApp",
  clubhouse: "Clubhouse",
  vimeo: "Vimeo",
  dailymotion: "Dailymotion",
  rumble: "Rumble",
  audiomack: "Audiomack",
  boomplay: "Boomplay",
  shazam: "Shazam",
  deezer: "Deezer",
  tidal: "Tidal",
  quora: "Quora",
  tumblr: "Tumblr",
  website: "Website & SEO",
  seo: "Website & SEO",
  traffic: "Website & SEO",
};

const ACTIONS: Array<[string, string]> = [
  ["followers", "followers"],
  ["subscribers", "subscribers"],
  ["members", "members"],
  ["likes", "likes"],
  ["views", "views"],
  ["plays", "plays"],
  ["streams", "streams"],
  ["comments", "comments"],
  ["shares", "shares"],
  ["reposts", "reposts"],
  ["retweets", "reposts"],
  ["saves", "saves"],
  ["votes", "votes"],
  ["traffic", "traffic"],
  ["reactions", "reactions"],
  ["impressions", "impressions"],
];

export type OwletCatalogService = {
  service: number;
  name: string;
  type?: string;
  category?: string;
  rate: string;
  min: string;
  max: string;
};

export type CatalogPlatformRow = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type CatalogServiceRow = {
  platform_id: string;
  name: string;
  action: string;
  category: string;
  is_active: boolean;
};

export type CatalogOfferRow = {
  provider_code: string;
  name: string;
  rate_kobo: number;
  min_qty: number;
  max_qty: number;
  quality_tier: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  /** platform_id|service name, resolved to a real service id after upsert. */
  service_key: string;
};

export type CatalogPlan = {
  platforms: CatalogPlatformRow[];
  services: CatalogServiceRow[];
  offers: CatalogOfferRow[];
};

export function platformNameFor(category: string): string {
  const tokens = category
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  for (const token of tokens) {
    const hit = PLATFORM_ALIASES[token];
    if (hit) return hit;
  }
  return "Other";
}

export function platformIdFor(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "other"
  );
}

export function actionFor(text: string) {
  const lower = text.toLowerCase();
  for (const [needle, action] of ACTIONS) {
    if (lower.includes(needle)) return action;
  }
  return "engagement";
}

/** Owlet USD per 1,000 → Galago kobo per unit, at cost + markup, rounded up. */
export function koboPerUnit(rateUsdPer1000: number, ngnPerUsd: number) {
  const perUnit = (rateUsdPer1000 / 1000) * ngnPerUsd * OWLET_MARKUP * 100;
  if (!Number.isFinite(perUnit) || perUnit <= 0) return 0;
  return Math.ceil(perUnit * 10000) / 10000;
}

function positiveInt(value: string | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

export function buildCatalogPlan(
  raw: OwletCatalogService[],
  ngnPerUsd: number
): CatalogPlan {
  const platformMap = new Map<string, CatalogPlatformRow>();
  const serviceMap = new Map<string, CatalogServiceRow>();
  const candidates: Array<{
    row: Omit<CatalogOfferRow, "name">;
    label: string;
    serviceName: string;
    typeLabel: string;
  }> = [];

  for (const s of raw) {
    const typeLabel = (s.type || "Default").trim();
    if (typeLabel.toLowerCase() !== ORDERABLE_TYPE) continue;

    const rate = Number(s.rate);
    const min = positiveInt(s.min);
    const max = positiveInt(s.max);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    if (min < 1 || max < min) continue;

    const category = (s.category || s.name || "Other").trim();
    const platformName = platformNameFor(category);
    const platformId = platformIdFor(platformName);
    if (!platformMap.has(platformId)) {
      platformMap.set(platformId, {
        id: platformId,
        name: platformName,
        sort_order: 0,
        is_active: true,
      });
    }

    const serviceKey = `${platformId}|${category}`;
    if (!serviceMap.has(serviceKey)) {
      serviceMap.set(serviceKey, {
        platform_id: platformId,
        name: category,
        action: actionFor(category),
        category,
        is_active: true,
      });
    }

    const rateKobo = koboPerUnit(rate, ngnPerUsd);
    if (rateKobo <= 0) continue;

    candidates.push({
      label: `${category} · ${typeLabel}`,
      serviceName: category,
      typeLabel,
      row: {
        provider_code: String(s.service),
        rate_kobo: rateKobo,
        min_qty: min,
        max_qty: max,
        quality_tier: typeLabel.toLowerCase().replace(/\s+/g, "-"),
        is_active: true,
        service_key: serviceKey,
        metadata: {
          provider: "owlet",
          owlet_service: s.service,
          owlet_type: typeLabel,
          owlet_rate_usd_per_1000: rate,
          ngn_per_usd: ngnPerUsd,
          markup: OWLET_MARKUP,
        },
      },
    });
  }

  // Several Owlet services share a category and type, so disambiguate repeated
  // labels with the Owlet id — otherwise the picker shows identical rows.
  const labelCounts = new Map<string, number>();
  for (const c of candidates) {
    labelCounts.set(c.label, (labelCounts.get(c.label) ?? 0) + 1);
  }

  const offers: CatalogOfferRow[] = candidates.map((c) => ({
    ...c.row,
    name:
      (labelCounts.get(c.label) ?? 0) > 1
        ? `${c.label} #${c.row.provider_code}`
        : c.label,
  }));

  offers.sort((a, b) => a.rate_kobo - b.rate_kobo || a.name.localeCompare(b.name));

  return {
    platforms: [...platformMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    services: [...serviceMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    offers,
  };
}
