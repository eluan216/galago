import "server-only";

import { isProfileReady } from "@/lib/esim-lifecycle";
import { providerPriceToNgnKobo } from "@/lib/esim-pricing";

const API_BASE_URL = "https://api.esimaccess.com/api/v1/open";
const REQUEST_TIMEOUT_MS = 20_000;

export type EsimLocation = {
  code: string;
  name: string;
  type: number;
  subLocationList?: EsimLocation[];
};

export type EsimPackage = {
  packageCode: string;
  slug?: string;
  name: string;
  price: number;
  currencyCode: string;
  volume: number;
  duration: number;
  durationUnit: string;
  location: string;
  locationCode?: string;
  activeType: number;
  speed?: string;
  dataType?: number;
  supportTopUpType?: number;
  locationNetworkList?: Array<{
    locationName: string;
    locationCode?: string;
    operatorList?: Array<{ operatorName: string; networkType: string }>;
  }>;
};

export type EsimProfile = {
  esimTranNo: string;
  orderNo: string;
  transactionId?: string;
  iccid?: string;
  ac: string;
  qrCodeUrl: string;
  smdpStatus: string;
  eid?: string;
  activeType: number;
  expiredTime?: string;
  totalVolume: number;
  totalDuration: number;
  durationUnit: string;
  orderUsage: number;
  esimStatus: string;
  packageList?: Array<{
    packageCode: string;
    duration: number;
    volume: number;
    locationCode: string;
  }>;
};

type EsimEnvelope<T> = {
  success: boolean;
  errorCode?: string | number | null;
  errorMsg?: string | null;
  errorMessage?: string | null;
  obj?: T | null;
};

export class EsimAccessError extends Error {
  constructor(
    message: string,
    readonly outcomeUnknown = false,
    readonly status?: number
  ) {
    super(message);
    this.name = "EsimAccessError";
  }
}

function getAccessCode() {
  const accessCode = process.env.ESIM_ACCESS_CODE;
  if (!accessCode) {
    throw new EsimAccessError("eSIM Access credentials are not configured");
  }
  return accessCode;
}

async function request<T>(
  path: string,
  payload: Record<string, unknown> = {}
): Promise<EsimEnvelope<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "RT-AccessCode": getAccessCode(),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "eSIM Access request timed out; order status is unknown"
        : "Could not reach eSIM Access; order status is unknown";
    throw new EsimAccessError(message, true);
  }

  let data: EsimEnvelope<T>;
  try {
    data = (await response.json()) as EsimEnvelope<T>;
  } catch {
    throw new EsimAccessError(
      "eSIM Access returned an unreadable response",
      response.ok || response.status >= 500,
      response.status
    );
  }

  if (!response.ok) {
    throw new EsimAccessError(
      `eSIM Access returned HTTP ${response.status}`,
      response.status >= 500,
      response.status
    );
  }
  return data;
}

function requireSuccess<T>(response: EsimEnvelope<T>, action: string) {
  if (!response.success || response.obj == null) {
    throw new EsimAccessError(
      response.errorMsg ||
        response.errorMessage ||
        `${action} failed (${response.errorCode ?? "unknown"})`
    );
  }
  return response.obj;
}

export function isEsimSuccess<T>(
  response: EsimEnvelope<T>
): response is EsimEnvelope<T> & { obj: T } {
  return response.success && response.obj != null;
}

export function esimErrorMessage<T>(
  response: EsimEnvelope<T>,
  action: string
) {
  return (
    response.errorMsg ||
    response.errorMessage ||
    `${action} failed (${response.errorCode ?? "unknown"})`
  );
}

export async function getLocations() {
  const response = await request<{ locationList?: EsimLocation[] }>(
    "/location/list"
  );
  return requireSuccess(response, "Loading eSIM destinations").locationList || [];
}

export async function getPackages(locationCode: string) {
  const response = await request<{ packageList?: EsimPackage[] }>(
    "/package/list",
    { locationCode, type: "BASE" }
  );
  return requireSuccess(response, "Loading eSIM packages").packageList || [];
}

export async function orderProfile(input: {
  transactionId: string;
  packageCode: string;
  price: number;
}) {
  return request<{ orderNo?: string; transactionId?: string }>(
    "/esim/order",
    {
      transactionId: input.transactionId,
      amount: input.price,
      packageInfoList: [
        {
          packageCode: input.packageCode,
          count: 1,
          price: input.price,
        },
      ],
    }
  );
}

export async function queryProfiles(orderNo: string) {
  const response = await request<{
    esimList?: EsimProfile[];
    pager?: { total?: number };
  }>("/esim/query", {
    orderNo,
    pager: { pageNum: 1, pageSize: 30 },
  });

  if (!response.success && String(response.errorCode) === "200010") {
    return { pending: true, profiles: [] as EsimProfile[] };
  }
  const result = requireSuccess(response, "Checking eSIM fulfilment");
  return { pending: false, profiles: result.esimList || [] };
}

export async function cancelProfile(esimTranNo: string) {
  return request<Record<string, unknown>>("/esim/cancel", { esimTranNo });
}

export async function queryUsage(esimTranNoList: string[]) {
  return request<{
    esimUsageList?: Array<{
      esimTranNo: string;
      dataUsage: number;
      totalData: number;
      lastUpdateTime: string;
    }>;
  }>("/esim/usage/query", { esimTranNoList });
}

export { providerPriceToNgnKobo };
export { isProfileReady };
