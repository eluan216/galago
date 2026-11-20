import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EsimAccessError,
  esimErrorMessage,
  getPackages,
  isEsimSuccess,
  orderProfile,
  queryProfiles,
} from "@/lib/esimaccess";
import { providerPriceToNgnKobo } from "@/lib/esim-pricing";
import { isOrderOutcomeUnknown, isProfileReady } from "@/lib/esim-lifecycle";
import { getUsdRates } from "@/lib/fx-rates";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function updatePurchase(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  transactionId: string,
  values: {
    status: "pending" | "delivered" | "failed";
    providerOrderNo?: string | null;
    providerError?: string | null;
    profiles?: unknown[];
  }
) {
  const { data, error } = await admin.rpc("esim_update_purchase", {
    p_user_id: userId,
    p_transaction_id: transactionId,
    p_status: values.status,
    p_provider_order_no: values.providerOrderNo || null,
    p_provider_error: values.providerError || null,
    p_profiles: values.profiles ?? null,
  });
  if (error) {
    console.error("esim_update_purchase RPC:", error);
    return null;
  }
  const result = data as Record<string, unknown>;
  if (result?.ok !== true) {
    console.error("esim_update_purchase RPC rejected:", result);
    return null;
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.ESIM_ACCESS_PURCHASES_ENABLED !== "true") {
      return NextResponse.json(
        {
          error:
            "eSIM purchases are disabled until live provider access and test funding are confirmed. No wallet debit was made.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const locationCode = String(body.location_code || "");
    const packageCode = String(body.package_code || "");
    const idempotencyKey = request.headers.get("idempotency-key") || "";
    if (
      !/^[A-Za-z0-9_-]{2,20}$/.test(locationCode) ||
      !/^[A-Za-z0-9_-]{2,100}$/.test(packageCode) ||
      !UUID_PATTERN.test(idempotencyKey)
    ) {
      return NextResponse.json(
        { error: "Choose a valid eSIM package and try again" },
        { status: 400 }
      );
    }

    const [packages, rates] = await Promise.all([
      getPackages(locationCode),
      getUsdRates(),
    ]);
    const selectedPackage = packages.find(
      (item) => item.packageCode === packageCode
    );
    if (!selectedPackage) {
      return NextResponse.json(
        { error: "This eSIM package is no longer available. Refresh and choose again." },
        { status: 400 }
      );
    }

    const chargeKobo = providerPriceToNgnKobo(
      selectedPackage.price,
      selectedPackage.currencyCode,
      rates.usdRates
    );
    if (!chargeKobo) {
      return NextResponse.json(
        { error: "Could not calculate a safe NGN price for this eSIM package" },
        { status: 502 }
      );
    }

    const transactionId = crypto.randomUUID().replace(/-/g, "");
    const admin = createAdminClient();
    const { data: started, error: startError } = await admin.rpc(
      "esim_start_purchase",
      {
        p_user_id: user.id,
        p_idempotency_key: idempotencyKey,
        p_transaction_id: transactionId,
        p_package_code: selectedPackage.packageCode,
        p_package_name: selectedPackage.name,
        p_package_slug: selectedPackage.slug || null,
        p_location_code: locationCode,
        p_provider_price_units: selectedPackage.price,
        p_provider_currency: selectedPackage.currencyCode,
        p_fx_rate_ngn_per_unit:
          rates.usdRates.NGN / rates.usdRates[selectedPackage.currencyCode],
        p_markup_percent: 7,
        p_charge_kobo: chargeKobo,
      }
    );

    if (startError) {
      console.error("esim_start_purchase RPC:", startError);
      return NextResponse.json({ error: "Could not start eSIM purchase" }, { status: 500 });
    }

    const start = started as Record<string, unknown>;
    if (start.ok !== true) {
      if (start.code === "insufficient_balance") {
        return NextResponse.json(
          {
            error: "Insufficient wallet balance. Fund your wallet before purchasing.",
            balance_kobo: start.balance_kobo,
          },
          { status: 402 }
        );
      }
      return NextResponse.json({ error: "Could not start eSIM purchase" }, { status: 400 });
    }

    if (start.created !== true) {
      return NextResponse.json(
        {
          transaction_id: start.transaction_id,
          status: start.status,
          amount_kobo: start.charge_kobo,
          profiles: start.profiles || [],
          message: "This eSIM request was already received. Check its status.",
        },
        { status: start.status === "pending" ? 202 : 200 }
      );
    }

    let response;
    try {
      response = await orderProfile({
        transactionId,
        packageCode: selectedPackage.packageCode,
        price: selectedPackage.price,
      });
    } catch (error) {
      if (!(error instanceof EsimAccessError) || error.outcomeUnknown) {
        console.error("eSIM Access order outcome unknown:", error);
        return NextResponse.json(
          {
            transaction_id: transactionId,
            status: "pending",
            amount_kobo: chargeKobo,
            message:
              "The provider result is not confirmed yet. Check this order's status before trying again.",
          },
          { status: 202 }
        );
      }

      const message = error.message;
      const resolved = await updatePurchase(admin, user.id, transactionId, {
        status: "failed",
        providerError: message,
      });
      if (!resolved) {
        return NextResponse.json(
          {
            transaction_id: transactionId,
            status: "pending",
            amount_kobo: chargeKobo,
            message: "The provider rejected the order, but the refund is still reconciling.",
          },
          { status: 202 }
        );
      }
      return NextResponse.json(
        { error: message, transaction_id: transactionId, status: "failed" },
        { status: 502 }
      );
    }

    if (isOrderOutcomeUnknown(response) || (response.success && response.obj == null)) {
      const providerOrderNo = response.obj?.orderNo || null;
      const providerError = esimErrorMessage(response, "Creating eSIM order");
      await updatePurchase(admin, user.id, transactionId, {
        status: "pending",
        providerOrderNo,
        providerError,
      });
      return NextResponse.json(
        {
          transaction_id: transactionId,
          provider_order_no: providerOrderNo,
          status: "pending",
          amount_kobo: chargeKobo,
          message:
            "The provider has not confirmed the order outcome. This order remains pending and must be reconciled before another purchase.",
        },
        { status: 202 }
      );
    }

    if (!isEsimSuccess(response)) {
      const message = esimErrorMessage(response, "Creating eSIM order");
      const resolved = await updatePurchase(admin, user.id, transactionId, {
        status: "failed",
        providerError: message,
      });
      if (!resolved) {
        return NextResponse.json(
          {
            transaction_id: transactionId,
            status: "pending",
            amount_kobo: chargeKobo,
            message: "The provider rejected the order, but the refund is still reconciling.",
          },
          { status: 202 }
        );
      }
      return NextResponse.json(
        { error: message, transaction_id: transactionId, status: "failed" },
        { status: 502 }
      );
    }

    const providerOrderNo = response.obj.orderNo || null;
    if (!providerOrderNo) {
      await updatePurchase(admin, user.id, transactionId, {
        status: "pending",
        providerError: "Provider accepted the request without returning an order number.",
      });
      return NextResponse.json(
        {
          transaction_id: transactionId,
          status: "pending",
          amount_kobo: chargeKobo,
          message: "Order accepted; waiting for the provider order reference.",
        },
        { status: 202 }
      );
    }

    let profiles: Awaited<ReturnType<typeof queryProfiles>>["profiles"] = [];
    try {
      const result = await queryProfiles(providerOrderNo);
      if (!result.pending) profiles = result.profiles;
    } catch (error) {
      console.error("eSIM initial fulfilment query:", error);
    }
    const delivered =
      profiles.length === 1 && profiles.every(isProfileReady);
    const resolved = await updatePurchase(admin, user.id, transactionId, {
      status: delivered ? "delivered" : "pending",
      providerOrderNo,
      profiles: delivered ? profiles : [],
      providerError: delivered
        ? null
        : "Provider accepted the order; profile allocation is not confirmed yet.",
    });

    return NextResponse.json(
      {
        transaction_id: transactionId,
        provider_order_no: providerOrderNo,
        status: resolved?.status || (delivered ? "delivered" : "pending"),
        amount_kobo: chargeKobo,
        profiles: resolved?.profiles || (delivered ? profiles : []),
        message: delivered
          ? "eSIM profile is ready."
          : "Order accepted; profile allocation is still pending.",
      },
      { status: resolved?.status === "delivered" ? 200 : 202 }
    );
  } catch (error) {
    console.error("eSIM purchase error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not complete eSIM purchase" },
      { status: error instanceof EsimAccessError ? 502 : 500 }
    );
  }
}
