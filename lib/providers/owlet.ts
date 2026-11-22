/**
 * Owlet SMM panel API (fulfillment source for Galago growth orders).
 * Docs: POST https://theowlet.com/api/v2  — actions: services, add, status, balance, …
 * Env: OWLET_API_KEY, OWLET_API_URL (optional), OWLET_ENABLED=true
 */

const DEFAULT_URL = "https://theowlet.com/api/v2";

export type OwletService = {
  service: number;
  name: string;
  type?: string;
  category?: string;
  rate: string;
  min: string;
  max: string;
  refill?: boolean;
  cancel?: boolean;
};

export type OwletOrderStatus = {
  charge?: string;
  start_count?: string;
  status?: string;
  remains?: string;
  currency?: string;
  error?: string;
};

function apiUrl() {
  return process.env.OWLET_API_URL || DEFAULT_URL;
}

function apiKey() {
  const key = process.env.OWLET_API_KEY;
  if (!key) throw new Error("OWLET_API_KEY is not set");
  return key;
}

export function isOwletEnabled() {
  return (
    process.env.OWLET_ENABLED === "true" && Boolean(process.env.OWLET_API_KEY)
  );
}

/** True when offer.provider_code is a real Owlet service id (not "demo"). */
export function isOwletServiceCode(code: string | null | undefined) {
  if (!code || code === "demo") return false;
  return /^\d+$/.test(String(code).trim());
}

async function owletPost(
  body: Record<string, string | number>
): Promise<unknown> {
  const res = await fetch(apiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(
      Object.entries(body).map(([k, v]) => [k, String(v)])
    ),
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Owlet non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(`Owlet HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return data;
}

export async function owletBalance() {
  const data = (await owletPost({
    key: apiKey(),
    action: "balance",
  })) as { balance?: string; currency?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data;
}

export async function owletServices(): Promise<OwletService[]> {
  const data = await owletPost({
    key: apiKey(),
    action: "services",
  });
  if (!Array.isArray(data)) {
    const err = data as { error?: string };
    throw new Error(err.error || "Owlet services response was not a list");
  }
  return data as OwletService[];
}

export async function owletAddOrder(params: {
  service: number;
  link: string;
  quantity: number;
}) {
  const data = (await owletPost({
    key: apiKey(),
    action: "add",
    service: params.service,
    link: params.link,
    quantity: params.quantity,
  })) as { order?: number | string; error?: string };
  if (data.error) throw new Error(data.error);
  if (data.order == null) throw new Error("Owlet add returned no order id");
  return { orderId: String(data.order) };
}

export async function owletOrderStatus(
  orderId: string
): Promise<OwletOrderStatus> {
  const data = (await owletPost({
    key: apiKey(),
    action: "status",
    order: orderId,
  })) as OwletOrderStatus;
  return data;
}

/** Map Owlet status string → Galago action */
export function mapOwletStatus(status: string | undefined): {
  action: "settle" | "settle_partial" | "release" | "processing" | "unknown";
  raw: string;
} {
  const s = (status || "").toLowerCase().trim();
  if (!s) return { action: "unknown", raw: status || "" };
  // Owlet only charged the delivered part and refunded the rest to its own
  // wallet, so a partial order must not be settled at the full hold.
  if (s === "partial") {
    return { action: "settle_partial", raw: status || s };
  }
  if (s === "completed" || s === "complete" || s === "success") {
    return { action: "settle", raw: status || s };
  }
  if (
    s === "canceled" ||
    s === "cancelled" ||
    s === "failed" ||
    s === "refunded" ||
    s === "error"
  ) {
    return { action: "release", raw: status || s };
  }
  if (
    s === "pending" ||
    s === "in progress" ||
    s === "processing" ||
    s === "in_progress" ||
    s === "awaiting"
  ) {
    return { action: "processing", raw: status || s };
  }
  return { action: "unknown", raw: status || s };
}
