"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboardLanguage } from "@/components/DashboardLanguageProvider";
import { translate } from "@/lib/dashboard-language";

type Location = {
  code: string;
  name: string;
  type: number;
  subLocationList?: Location[];
};

type EsimPackage = {
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
  charge_kobo: number | null;
  locationNetworkList?: Array<{
    locationName: string;
    operatorList?: Array<{ operatorName: string; networkType: string }>;
  }>;
};

type EsimProfile = {
  esimTranNo: string;
  iccid?: string;
  ac: string;
  qrCodeUrl: string;
  smdpStatus: string;
  eid?: string;
  expiredTime?: string;
  totalVolume: number;
  totalDuration: number;
  durationUnit: string;
  orderUsage: number;
  esimStatus: string;
};

type EsimOrder = {
  id: string;
  transaction_id: string;
  provider_order_no: string | null;
  package_code: string;
  package_name: string;
  location_code: string;
  charge_kobo: number;
  status: "pending" | "delivered" | "failed" | "cancelled";
  provider_error: string | null;
  provider_cancel_confirmed_at: string | null;
  profiles: EsimProfile[];
  created_at: string;
};

type Usage = {
  esimTranNo: string;
  dataUsage: number;
  totalData: number;
  lastUpdateTime: string;
};

const cardClass =
  "bg-white text-[var(--ink)] rounded-[22px] p-5 sm:p-6 shadow-[0_10px_30px_rgba(10,5,90,0.15)]";
const inputClass =
  "w-full bg-[var(--of)] border-2 border-[var(--ink)]/15 rounded-xl px-3.5 py-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--bl)] transition";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "See provider plan details";
  const gib = bytes / 1024 ** 3;
  if (gib >= 1) return `${Number(gib.toFixed(2))} GB`;
  return `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;
}

function flattenLocations(locations: Location[]): Location[] {
  return locations.flatMap((location) => [
    location,
    ...flattenLocations(location.subLocationList || []),
  ]);
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

export default function EsimPage() {
  const locale = useDashboardLanguage();
  const t = (source: string) => translate(locale, source);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationCode, setLocationCode] = useState("");
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [selectedPackageCode, setSelectedPackageCode] = useState("");
  const [orders, setOrders] = useState<EsimOrder[]>([]);
  const [purchasesEnabled, setPurchasesEnabled] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [idempotency, setIdempotency] = useState<{
    key: string;
    packageCode: string;
    locationCode: string;
  } | null>(null);
  const [usageByOrder, setUsageByOrder] = useState<Record<string, Usage[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const allLocations = useMemo(() => flattenLocations(locations), [locations]);
  const selectedPackage = packages.find(
    (item) => item.packageCode === selectedPackageCode
  );

  const loadOrders = useCallback(async () => {
    const response = await fetch("/api/esim/orders");
    const data = await responseJson(response);
    if (!response.ok) {
      throw new Error(String(data.error || "Could not load eSIM orders"));
    }
    setOrders((data.orders || []) as EsimOrder[]);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [locationsResponse, ordersResponse] = await Promise.all([
          fetch("/api/esim/locations"),
          fetch("/api/esim/orders"),
        ]);
        const [locationData, orderData] = await Promise.all([
          responseJson(locationsResponse),
          responseJson(ordersResponse),
        ]);
        if (!locationsResponse.ok) {
          throw new Error(String(locationData.error || "Could not load destinations"));
        }
        if (!ordersResponse.ok) {
          throw new Error(String(orderData.error || "Could not load eSIM orders"));
        }
        if (!active) return;
        const list = (locationData.locations || []) as Location[];
        setLocations(list);
        setPurchasesEnabled(locationData.purchases_enabled === true);
        setOrders((orderData.orders || []) as EsimOrder[]);
        const first = flattenLocations(list)[0];
        if (first) setLocationCode(first.code);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load eSIM services"
          );
        }
      } finally {
        if (active) setLoadingLocations(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!locationCode) return;
    let active = true;
    async function loadPackages() {
      setLoadingPackages(true);
      setPackages([]);
      setSelectedPackageCode("");
      try {
        const response = await fetch(
          `/api/esim/packages?locationCode=${encodeURIComponent(locationCode)}`
        );
        const data = await responseJson(response);
        if (!response.ok) {
          throw new Error(String(data.error || "Could not load eSIM packages"));
        }
        if (active) setPackages((data.packages || []) as EsimPackage[]);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load eSIM packages"
          );
        }
      } finally {
        if (active) setLoadingPackages(false);
      }
    }
    void loadPackages();
    return () => {
      active = false;
    };
  }, [locationCode]);

  async function handlePurchase() {
    if (!selectedPackage || selectedPackage.charge_kobo === null) return;
    setPurchasing(true);
    setError(null);
    setMessage(null);
    const key =
      idempotency?.packageCode === selectedPackage.packageCode &&
      idempotency.locationCode === locationCode
        ? idempotency.key
        : crypto.randomUUID();
    setIdempotency({
      key,
      packageCode: selectedPackage.packageCode,
      locationCode,
    });

    try {
      const response = await fetch("/api/esim/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({
          location_code: locationCode,
          package_code: selectedPackage.packageCode,
        }),
      });
      const data = await responseJson(response);
      setIdempotency(null);
      if (!response.ok && response.status !== 202) {
        await loadOrders().catch((loadError: unknown) => {
          console.error("Could not refresh eSIM orders:", loadError);
        });
        throw new Error(String(data.error || "Could not start eSIM purchase"));
      }
      setMessage(String(data.message || "eSIM order submitted."));
      await loadOrders();
    } catch (purchaseError) {
      setError(
        purchaseError instanceof Error
          ? purchaseError.message
          : "Network error. Retry the same package to avoid a duplicate charge."
      );
    } finally {
      setPurchasing(false);
    }
  }

  async function checkStatus(orderId: string) {
    setBusyOrderId(orderId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/esim/orders/${orderId}/status`, {
        method: "POST",
      });
      const data = await responseJson(response);
      if (!response.ok) throw new Error(String(data.error || "Could not check order"));
      setMessage(String(data.message || "eSIM status refreshed."));
      await loadOrders();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Could not check eSIM order status"
      );
    } finally {
      setBusyOrderId(null);
    }
  }

  async function checkUsage(orderId: string) {
    setBusyOrderId(orderId);
    setError(null);
    try {
      const response = await fetch(`/api/esim/orders/${orderId}/usage`);
      const data = await responseJson(response);
      if (!response.ok) throw new Error(String(data.error || "Could not load usage"));
      setUsageByOrder((current) => ({
        ...current,
        [orderId]: (data.usage || []) as Usage[],
      }));
    } catch (usageError) {
      setError(
        usageError instanceof Error ? usageError.message : "Could not load eSIM usage"
      );
    } finally {
      setBusyOrderId(null);
    }
  }

  async function cancelOrder(order: EsimOrder) {
    if (
      !window.confirm(
        "Request cancellation? The wallet is refunded only if eSIM Access confirms the profile is unused and cancellable."
      )
    ) {
      return;
    }
    setBusyOrderId(order.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/esim/orders/${order.id}/cancel`, {
        method: "POST",
      });
      const data = await responseJson(response);
      if (!response.ok && response.status !== 202) {
        throw new Error(String(data.error || "Could not cancel eSIM"));
      }
      setMessage(String(data.error || "eSIM cancellation and refund confirmed."));
      await loadOrders();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Could not cancel eSIM order"
      );
    } finally {
      setBusyOrderId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">
          eSIM
        </h1>
        <p className="text-white/65 text-[13px] mt-1">
          {t("Browse travel data plans. Purchases charge your NGN wallet.")}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px] font-medium break-words"
        >
          {error}
        </div>
      )}
      {message && (
        <div className="px-3.5 py-2.5 rounded-xl bg-[var(--li)]/25 border border-[var(--li)]/50 text-[var(--ink)] text-[13px] font-medium">
          {message}
        </div>
      )}

      <section className={cardClass}>
        <h2 className="text-[15px] font-black uppercase tracking-tight">
          {t("Find a plan")}
        </h2>
        <p className="text-[var(--mu)] text-[13px] mt-1 mb-4">
          {t("Prices include the 7% eSIM markup. Your available balance remains in NGN.")}
        </p>
        {!purchasesEnabled && !loadingLocations && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900">
            {t("eSIM purchases are disabled until live provider access and test funding are confirmed. Browsing plans does not debit your wallet.")}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="esim-location"
              className="block text-[12px] font-semibold text-[var(--mu)] mb-1.5"
            >
              {t("Destination")}
            </label>
            <select
              id="esim-location"
              value={locationCode}
              onChange={(event) => setLocationCode(event.target.value)}
              className={inputClass}
              disabled={loadingLocations || allLocations.length === 0}
            >
              {loadingLocations && <option value="">{t("Loading destinations…")}</option>}
              {allLocations.map((location, index) => (
                <option key={`${location.code}-${index}`} value={location.code}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {loadingPackages ? (
            <p className="text-[13px] text-[var(--mu)]">{t("Loading plans…")}</p>
          ) : packages.length === 0 ? (
            <p className="text-[13px] text-[var(--mu)]">
              {t("No packages are available for this destination.")}
            </p>
          ) : (
            <div className="grid gap-3">
              {packages.map((item) => {
                const networks =
                  item.locationNetworkList
                    ?.flatMap((location) =>
                      (location.operatorList || []).map(
                        (operator) => `${operator.operatorName} (${operator.networkType})`
                      )
                    )
                    .join(", ") || "";
                return (
                  <label
                    key={item.packageCode}
                    className={`block rounded-xl border-2 p-4 cursor-pointer transition ${
                      selectedPackageCode === item.packageCode
                        ? "border-[var(--bl)] bg-[var(--bl)]/5"
                        : "border-[var(--ink)]/10 hover:border-[var(--ink)]/25"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="esim-package"
                        value={item.packageCode}
                        checked={selectedPackageCode === item.packageCode}
                        onChange={() => setSelectedPackageCode(item.packageCode)}
                        className="mt-1 accent-[var(--bl)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-start justify-between gap-2">
                          <span className="font-bold">{item.name}</span>
                          <span className="font-black tabular-nums">
                            {item.charge_kobo === null
                              ? t("Price unavailable")
                              : formatNaira(item.charge_kobo)}
                          </span>
                        </span>
                        <span className="block text-[12px] text-[var(--mu)] mt-1">
                          {formatBytes(item.volume)} · {item.duration}{" "}
                          {item.durationUnit.toLowerCase()}
                        </span>
                        {networks && (
                          <span className="block text-[11px] text-[var(--mu)] mt-1">
                            {t("Networks")}: {networks}
                          </span>
                        )}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={handlePurchase}
            disabled={
              !purchasesEnabled ||
              !selectedPackage ||
              selectedPackage.charge_kobo === null ||
              purchasing
            }
            className="btn-galago btn-galago-sm w-full sm:w-auto disabled:opacity-50"
          >
            {purchasing
              ? "Submitting…"
              : selectedPackage?.charge_kobo
                ? `Purchase for ${formatNaira(selectedPackage.charge_kobo)}`
                : t("Select a package")}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-white mb-3">
          {t("Your eSIM orders")}
        </h2>
        {orders.length === 0 ? (
          <p className="text-white/60 text-[13px]">{t("No eSIM orders yet.")}</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const profile = order.profiles?.[0];
              const canCancel =
                order.status === "delivered" &&
                profile?.orderUsage === 0 &&
                profile?.esimStatus === "GOT_RESOURCE" &&
                profile?.smdpStatus === "RELEASED";
              return (
                <article key={order.id} className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{order.package_name}</h3>
                      <p className="text-[12px] text-[var(--mu)] mt-1">
                        {formatNaira(order.charge_kobo)} ·{" "}
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--bl)]/10 px-3 py-1 text-[11px] font-bold uppercase text-[var(--bl)]">
                      {t(order.status.replace(/_/g, " "))}
                    </span>
                  </div>

                  {order.status === "pending" && (
                    <div className="mt-4">
                      <p className="text-[12px] text-amber-800 mb-3">
                        {order.provider_error ||
                          "The provider has not confirmed profile allocation. Do not purchase again."}
                      </p>
                      <button
                        type="button"
                        onClick={() => checkStatus(order.id)}
                        disabled={busyOrderId === order.id}
                        className="text-[12px] font-bold text-[var(--bl)] hover:underline disabled:opacity-50"
                      >
                        {busyOrderId === order.id ? "Checking…" : "Check status"}
                      </button>
                    </div>
                  )}

                  {order.status === "failed" && (
                    <p className="text-[12px] text-rose-700 mt-3">
                      {order.provider_error || "The provider rejected the order."} Wallet debit refunded.
                    </p>
                  )}

                  {order.status === "delivered" && profile && (
                    <div className="mt-4 border-t border-[var(--ink)]/10 pt-4 space-y-4">
                      <p className="text-[13px] font-bold text-emerald-700">
                        Profile delivered · {profile.esimStatus} / {profile.smdpStatus}
                      </p>
                      {(profile.qrCodeUrl || profile.ac) && (
                        <div className="flex flex-wrap items-start gap-4">
                          {profile.qrCodeUrl && (
                            <a
                              href={profile.qrCodeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-xl border border-[var(--ink)]/10 p-2"
                            >
                              <img
                                src={profile.qrCodeUrl}
                                alt="eSIM installation QR code"
                                referrerPolicy="no-referrer"
                                className="w-36 h-36 object-contain"
                              />
                            </a>
                          )}
                          <div className="min-w-[220px] flex-1">
                            {profile.ac && (
                              <>
                                <p className="text-[12px] font-bold">{t("Manual activation code")}</p>
                                <code className="block break-all rounded-lg bg-[var(--of)] p-2 mt-1 text-[11px]">
                                  {profile.ac}
                                </code>
                              </>
                            )}
                            <ol className="list-decimal pl-4 mt-3 space-y-1 text-[11px] text-[var(--mu)]">
                              <li>{t("Connect your phone to Wi-Fi.")}</li>
                              <li>{t("Open cellular/mobile settings and choose Add eSIM.")}</li>
                              <li>{t("Scan the QR code or enter the activation code manually.")}</li>
                            </ol>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4">
                        <button
                          type="button"
                          onClick={() => checkUsage(order.id)}
                          disabled={busyOrderId === order.id}
                          className="text-[12px] font-bold text-[var(--bl)] hover:underline disabled:opacity-50"
                        >
                          {busyOrderId === order.id ? t("Loading…") : t("Refresh usage")}
                        </button>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => cancelOrder(order)}
                            disabled={busyOrderId === order.id}
                            className="text-[12px] font-bold text-rose-700 hover:underline disabled:opacity-50"
                          >
                            {t("Request cancellation")}
                          </button>
                        )}
                      </div>
                      {usageByOrder[order.id]?.map((usage) => (
                        <p
                          key={usage.esimTranNo}
                          className="rounded-lg bg-[var(--of)] p-3 text-[12px]"
                        >
                          {t("Data used:")} {formatBytes(usage.dataUsage)} /{" "}
                          {formatBytes(usage.totalData)} · {t("Updated")}{" "}
                          {new Date(usage.lastUpdateTime).toLocaleString()}
                        </p>
                      ))}
                    </div>
                  )}

                  {order.provider_cancel_confirmed_at &&
                    order.status === "delivered" && (
                      <p className="text-[12px] text-amber-800 mt-3">
                        Provider cancellation is confirmed; wallet refund is reconciling.
                      </p>
                    )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
