import { randomUUID } from "crypto";

const SANDBOX_URL = "https://sandbox.vtpass.com/api";
const LIVE_URL = "https://vtpass.com/api";
const TIMEOUT_MS = 15_000;

export type VtpassCategory = {
  identifier: string;
  name: string;
};

export type VtpassProduct = {
  serviceID: string;
  name: string;
  minimium_amount?: string;
  minimum_amount?: string;
  maximum_amount?: string;
  product_type?: string;
};

export type VtpassVariation = {
  variation_code: string;
  name: string;
  variation_amount: string;
  fixedPrice?: string;
};

export type VtpassResponse = {
  code?: string | number;
  response_description?: string;
  content?: {
    transactions?: {
      status?: string;
      transactionId?: string;
    };
    Customer_Name?: string;
    Current_Bouquet?: string;
    Renewal_Amount?: string | number;
    [key: string]: unknown;
  };
  requestId?: string;
  purchased_code?: string;
  token?: string;
  cards?: Array<{ Serial?: string; Pin?: string }>;
  [key: string]: unknown;
};

export type VtpassTransactionState = "pending" | "delivered" | "failed";

export function isProductionPurchaseDisabled(
  vercelEnvironment: string | undefined,
  vtpassEnvironment: string | undefined
) {
  return vercelEnvironment === "production" && vtpassEnvironment !== "live";
}

const TERMINAL_FAILURE_CODES = new Set([
  "010",
  "011",
  "012",
  "013",
  "016",
  "017",
  "018",
  "019",
  "021",
  "022",
  "023",
  "024",
  "027",
  "028",
  "030",
  "031",
  "032",
  "034",
  "035",
  "040",
  "091",
]);

export class VtpassError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "VtpassError";
  }
}

function config() {
  const apiKey = process.env.VTPASS_API_KEY;
  const publicKey = process.env.VTPASS_PUBLIC_KEY;
  const secretKey = process.env.VTPASS_SECRET_KEY;
  const mode = process.env.VTPASS_ENVIRONMENT || "sandbox";

  if (mode !== "sandbox" && mode !== "live") {
    throw new VtpassError("VTPASS_ENVIRONMENT must be sandbox or live");
  }
  if (!apiKey || !publicKey || !secretKey) {
    throw new VtpassError(
      "VTpass API credentials are not configured (API key, public key, and secret key are required)"
    );
  }

  return {
    apiKey,
    publicKey,
    secretKey,
    baseUrl: mode === "live" ? LIVE_URL : SANDBOX_URL,
  };
}

async function request(
  path: string,
  method: "GET" | "POST",
  payload?: Record<string, unknown>
): Promise<VtpassResponse> {
  const settings = config();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "api-key": settings.apiKey,
  };
  if (method === "GET") headers["public-key"] = settings.publicKey;
  else headers["secret-key"] = settings.secretKey;

  let response: Response;
  try {
    response = await fetch(`${settings.baseUrl}/${path}`, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new VtpassError("VTpass request timed out; transaction status is unknown");
    }
    throw new VtpassError("Could not reach VTpass; transaction status is unknown");
  }

  const body = await response.text();
  let data: VtpassResponse;
  try {
    data = JSON.parse(body) as VtpassResponse;
  } catch {
    throw new VtpassError("VTpass returned an unreadable response", response.status);
  }
  if (!response.ok) {
    throw new VtpassError(
      `VTpass returned HTTP ${response.status}`,
      response.status
    );
  }
  return data;
}

export async function getCategories() {
  const response = await request("service-categories", "GET");
  return Array.isArray(response.content)
    ? (response.content as VtpassCategory[])
    : [];
}

export async function getProducts(category: string) {
  const response = await request(
    `services?identifier=${encodeURIComponent(category)}`,
    "GET"
  );
  return Array.isArray(response.content)
    ? (response.content as VtpassProduct[])
    : [];
}

export async function getVariations(serviceId: string) {
  const response = await request(
    `service-variations?serviceID=${encodeURIComponent(serviceId)}`,
    "GET"
  );
  const content = response.content as
    | { variations?: VtpassVariation[]; varations?: VtpassVariation[] }
    | undefined;
  return content?.variations || content?.varations || [];
}

export async function verifyCustomer(payload: {
  serviceID: string;
  billersCode: string;
  type?: string;
}) {
  return request("merchant-verify", "POST", payload);
}

export async function purchase(payload: Record<string, unknown>) {
  return request("pay", "POST", payload);
}

export async function requery(requestId: string) {
  return request("requery", "POST", { request_id: requestId });
}

export function createVtpassRequestId(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const timestamp =
    value("year") + value("month") + value("day") + value("hour") + value("minute");
  return `${timestamp}${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function ngnToKobo(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || !/^\d+(\.\d{1,2})?$/.test(String(value))) {
    return null;
  }
  const kobo = Math.round(amount * 100);
  return Number.isSafeInteger(kobo) ? kobo : null;
}

export function classifyTransaction(response: VtpassResponse): VtpassTransactionState {
  const code = String(response.code ?? "");
  const status = String(response.content?.transactions?.status ?? "").toLowerCase();

  if (status === "delivered") return "delivered";
  if (status === "failed" || status === "reversed" || status === "cancelled") {
    return "failed";
  }
  if (TERMINAL_FAILURE_CODES.has(code)) return "failed";
  return "pending";
}

export function isTerminalFailureCode(code: string | number | undefined) {
  return TERMINAL_FAILURE_CODES.has(String(code ?? ""));
}

export function isVerificationSuccess(response: VtpassResponse) {
  return ["000", "020"].includes(String(response.code ?? ""));
}
