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

/** What a unit actually buys, labelled the way Owlet describes the service, so
 *  buyers know they are paying for followers, comments, views, etc. */
const SERVICE_KINDS: Array<[string, string, string]> = [
  ["comment like", "💬", "Comment likes"],
  ["comment", "💬", "Comments"],
  ["dislike", "👎", "Dislikes"],
  ["chat bot", "💬", "Chat bots"],
  ["bot start", "🤖", "Bot starts"],
  ["space listener", "🎧", "Space listeners"],
  ["listener", "🎧", "Listeners"],
  ["post read", "👀", "Post reads"],
  ["pk battle", "⚔️", "Live PK battles"],
  ["like", "❤️", "Likes"],
  ["follower", "👥", "Followers"],
  ["follow", "👥", "Followers"],
  ["subscriber", "🔔", "Subscribers"],
  ["subscribe", "🔔", "Subscribers"],
  ["member", "👥", "Members"],
  ["connect", "👥", "Connections"],
  ["view", "👀", "Views"],
  ["watch hour", "⏱️", "Watch hours"],
  ["play", "▶️", "Plays"],
  ["stream", "🎧", "Streams"],
  ["sharing", "🔁", "Shares"],
  ["share", "🔁", "Shares"],
  ["repost", "🔁", "Reposts"],
  ["retweet", "🔁", "Reposts"],
  ["react", "👍", "Reactions"],
  ["save", "🔖", "Saves"],
  ["vote", "🗳️", "Votes"],
  ["poll", "🗳️", "Votes"],
  ["boost", "🚀", "Boosts"],
  ["impression", "📈", "Impressions"],
  ["traffic", "🌐", "Traffic"],
  ["visit", "🌐", "Visits"],
  ["download", "⬇️", "Downloads"],
  ["review", "⭐", "Reviews"],
  ["rating", "⭐", "Ratings"],
  ["mention", "📣", "Mentions"],
  ["invite", "📨", "Invites"],
  ["click", "👆", "Clicks"],
  ["story", "📖", "Stories"],
];

function serviceKind(text: string) {
  const lower = text.toLowerCase();
  for (const [needle, emoji, label] of SERVICE_KINDS) {
    if (lower.includes(needle)) return { emoji, label };
  }
  return null;
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Drops the type label and the platform word so only the "what" is left. */
function stripOwletName(
  owletName: string,
  platformName: string,
  typeLabel: string
) {
  let cleaned = owletName.replace(
    new RegExp(`\\[?\\s*${escapeRegExp(typeLabel)}\\s*\\]?`, "gi"),
    " "
  );
  for (const word of platformName.split(/\s+/)) {
    if (word.length < 3) continue;
    cleaned = cleaned.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi"), " ");
  }
  return cleaned
    .replace(/[·|/]+/g, " ")
    .replace(/\(\s*\)|\[\s*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Turn an Owlet service name into a short "what you get" label, e.g.
 *  "TikTok Comments [Default]" → "💬 Comments". */
export function offerLabel(
  owletName: string,
  platformName: string,
  typeLabel: string
) {
  const cleaned = stripOwletName(owletName, platformName, typeLabel);
  // Owlet names are "what | targeting | speed"; the head is the deliverable,
  // so prefer it over the whole marketing string when nothing matched.
  const head = stripOwletName(
    owletName.split(/[|·]/)[0],
    platformName,
    typeLabel
  );

  const kind =
    serviceKind(head) ?? serviceKind(cleaned) ?? serviceKind(owletName);
  if (kind) return `${kind.emoji} ${kind.label}`;

  const fallback = (head || cleaned || owletName).slice(0, 60).trim();
  return `⚡ ${fallback}`;
}

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
    owletName: string;
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
      owletName: s.name || category,
      label: offerLabel(s.name || category, platformName, typeLabel),
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
          owlet_name: s.name || category,
          owlet_rate_usd_per_1000: rate,
          ngn_per_usd: ngnPerUsd,
          markup: OWLET_MARKUP,
        },
      },
    });
  }

  // Several Owlet services deliver the same thing (e.g. many "Followers"
  // packages), so disambiguate repeated labels with the Owlet id — otherwise
  // the picker shows identical rows.
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
