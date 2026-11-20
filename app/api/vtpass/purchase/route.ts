import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  classifyTransaction,
  createVtpassRequestId,
  getProducts,
  getVariations,
  isProductionPurchaseDisabled,
  isVerificationSuccess,
  ngnToKobo,
  purchase,
  verifyCustomer,
  VtpassError,
  type VtpassResponse,
} from "@/lib/vtpass";

export const runtime = "nodejs";

const CATEGORIES = new Set([
  "airtime",
  "data",
  "electricity-bill",
  "tv-subscription",
  "education",
]);

function providerFields(response: VtpassResponse) {
  return {
    p_provider_code: response.code == null ? null : String(response.code),
    p_response_description: response.response_description || null,
    p_provider_transaction_id:
      response.content?.transactions?.transactionId || null,
    p_purchased_code:
      response.purchased_code || response.token || null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      isProductionPurchaseDisabled(
        process.env.VERCEL_ENV,
        process.env.VTPASS_ENVIRONMENT
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Bill purchases are disabled in production until VTpass live mode is configured. No wallet debit was made.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const category = String(body.category || "");
    const serviceId = String(body.service_id || "");
    const phone = String(body.phone || "").replace(/\D/g, "");
    const variationCode = body.variation_code
      ? String(body.variation_code)
      : null;
    const customerReference = String(body.customer_reference || "").trim();
    const meterType = body.meter_type === "prepaid" || body.meter_type === "postpaid"
      ? body.meter_type
      : null;
    const quantity = body.quantity === undefined ? 1 : Number(body.quantity);
    const idempotencyKey = request.headers.get("idempotency-key") || "";

    if (
      !CATEGORIES.has(category) ||
      !/^[a-z0-9-]{2,80}$/.test(serviceId) ||
      !/^\d{10,14}$/.test(phone) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idempotencyKey
      ) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10 ||
      (category !== "education" && quantity !== 1)
    ) {
      return NextResponse.json({ error: "Check the purchase details and try again" }, { status: 400 });
    }

    const products = await getProducts(category);
    const product = products.find((item) => item.serviceID === serviceId);
    if (!product) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    let variationName = "";
    let amountKobo: number | null = null;
    const payload: Record<string, unknown> = {
      request_id: createVtpassRequestId(),
      serviceID: serviceId,
      phone,
    };

    if (category === "airtime" || category === "electricity-bill") {
      const providedAmount = ngnToKobo(body.amount_ngn);
      if (!providedAmount || providedAmount % 100 !== 0) {
        return NextResponse.json({ error: "Enter a whole-naira amount" }, { status: 400 });
      }

      const minimum = Number(product.minimum_amount ?? product.minimium_amount);
      const maximum = Number(product.maximum_amount);
      const amountNgn = providedAmount / 100;
      if (
        (Number.isFinite(minimum) && minimum > 0 && amountNgn < minimum) ||
        (Number.isFinite(maximum) && maximum > 0 && amountNgn > maximum)
      ) {
        return NextResponse.json(
          { error: `Amount must be between ₦${minimum || 1} and ₦${maximum || 1000000}` },
          { status: 400 }
        );
      }
      amountKobo = providedAmount;
      payload.amount = amountNgn;

      if (category === "electricity-bill") {
        if (!meterType || !/^\d{6,30}$/.test(customerReference)) {
          return NextResponse.json({ error: "Enter a valid meter number and meter type" }, { status: 400 });
        }
        const verification = await verifyCustomer({
          serviceID: serviceId,
          billersCode: customerReference,
          type: meterType,
        });
        if (!isVerificationSuccess(verification)) {
          return NextResponse.json(
            { error: verification.response_description || "Could not verify this meter" },
            { status: 422 }
          );
        }
        variationName = meterType === "prepaid" ? "Prepaid meter" : "Postpaid meter";
        payload.billersCode = customerReference;
        payload.variation_code = meterType;
      }
    } else {
      if (!variationCode) {
        return NextResponse.json({ error: "Choose a plan" }, { status: 400 });
      }
      const variations = await getVariations(serviceId);
      const variation = variations.find(
        (item) => item.variation_code === variationCode
      );
      if (!variation) {
        return NextResponse.json({ error: "Plan is no longer available. Refresh and choose again." }, { status: 400 });
      }

      const unitKobo = ngnToKobo(variation.variation_amount);
      if (!unitKobo) {
        return NextResponse.json({ error: "VTpass returned an invalid plan price" }, { status: 502 });
      }
      amountKobo = unitKobo * quantity;
      variationName = variation.name;
      payload.variation_code = variationCode;
      payload.amount = unitKobo / 100;
      if (category === "education") payload.quantity = quantity;

      if (category === "data") {
        payload.phone = phone;
      } else if (category === "tv-subscription") {
        if (!/^\d{6,30}$/.test(customerReference)) {
          return NextResponse.json({ error: "Enter a valid decoder or account number" }, { status: 400 });
        }
        const verification = await verifyCustomer({
          serviceID: serviceId,
          billersCode: customerReference,
        });
        if (!isVerificationSuccess(verification)) {
          return NextResponse.json(
            { error: verification.response_description || "Could not verify this account" },
            { status: 422 }
          );
        }
        payload.billersCode = customerReference;
        payload.subscription_type = "change";
      }
    }

    if (!amountKobo || !Number.isSafeInteger(amountKobo)) {
      return NextResponse.json({ error: "Invalid purchase amount" }, { status: 400 });
    }

    const admin = createAdminClient();
    const providerRequestId = String(payload.request_id);
    const { data: started, error: startError } = await admin.rpc(
      "vtpass_start_purchase",
      {
        p_user_id: user.id,
        p_idempotency_key: idempotencyKey,
        p_request_id: providerRequestId,
        p_category: category,
        p_service_id: serviceId,
        p_service_name: product.name,
        p_variation_code: variationCode || meterType,
        p_product_name: variationName || product.name,
        p_customer_reference: customerReference || phone,
        p_phone: phone,
        p_amount_kobo: amountKobo,
      }
    );
    if (startError) {
      console.error("vtpass_start_purchase RPC:", startError);
      return NextResponse.json({ error: "Could not start purchase" }, { status: 500 });
    }

    const start = started as Record<string, unknown>;
    if (!start.ok) {
      if (start.code === "insufficient_balance") {
        return NextResponse.json(
          {
            error: "Insufficient wallet balance. Fund your wallet before purchasing.",
            balance_kobo: start.balance_kobo,
          },
          { status: 402 }
        );
      }
      return NextResponse.json({ error: "Could not start purchase" }, { status: 400 });
    }

    if (!start.created) {
      return NextResponse.json({
        transaction_id: start.transaction_id,
        request_id: start.request_id,
        status: start.status,
        amount_kobo: start.amount_kobo,
        purchased_code: start.purchased_code,
        message: "This purchase request was already received. Check its status.",
      }, { status: start.status === "pending" ? 202 : 200 });
    }

    let providerResponse: VtpassResponse;
    try {
      providerResponse = await purchase(payload);
    } catch (error) {
      console.error("VTpass purchase outcome unknown:", error);
      return NextResponse.json(
        {
          transaction_id: start.transaction_id,
          request_id: providerRequestId,
          status: "pending",
          amount_kobo: amountKobo,
          message: "Purchase submitted; delivery is not confirmed yet. Check status before trying again.",
        },
        { status: 202 }
      );
    }

    const status = classifyTransaction(providerResponse);
    const { data: resolved, error: resolveError } = await admin.rpc(
      "vtpass_resolve_purchase",
      {
        p_user_id: user.id,
        p_request_id: providerRequestId,
        p_status: status,
        ...providerFields(providerResponse),
      }
    );
    if (resolveError) {
      console.error("vtpass_resolve_purchase RPC:", resolveError);
      return NextResponse.json(
        {
          transaction_id: start.transaction_id,
          request_id: providerRequestId,
          status: "pending",
          amount_kobo: amountKobo,
          message: "VTpass returned a result, but Galago could not record it. Check status before retrying.",
        },
        { status: 202 }
      );
    }

    return NextResponse.json(
      {
        transaction_id: start.transaction_id,
        request_id: providerRequestId,
        status: (resolved as Record<string, unknown>).status || status,
        amount_kobo: amountKobo,
        purchased_code: (resolved as Record<string, unknown>).purchased_code || null,
        message: providerResponse.response_description || null,
      },
      { status: status === "pending" ? 202 : 200 }
    );
  } catch (error) {
    if (error instanceof VtpassError) {
      const status = error.status === 401 || error.status === 403 ? 502 : 503;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("VTpass purchase error:", error);
    return NextResponse.json({ error: "Could not complete the purchase" }, { status: 500 });
  }
}
