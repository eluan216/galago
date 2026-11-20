import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProducts, isVerificationSuccess, verifyCustomer, VtpassError } from "@/lib/vtpass";

export const runtime = "nodejs";

const VERIFY_CATEGORIES = new Set(["electricity-bill", "tv-subscription"]);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const category = String(body.category || "");
    const serviceId = String(body.service_id || "");
    const billersCode = String(body.billers_code || "").trim();
    const type = body.type === "prepaid" || body.type === "postpaid"
      ? body.type
      : undefined;

    if (
      !VERIFY_CATEGORIES.has(category) ||
      !/^[a-z0-9-]{2,80}$/.test(serviceId) ||
      !/^\d{6,30}$/.test(billersCode) ||
      (category === "electricity-bill" && !type)
    ) {
      return NextResponse.json({ error: "Check the service and account number" }, { status: 400 });
    }

    const products = await getProducts(category);
    if (!products.some((product) => product.serviceID === serviceId)) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const result = await verifyCustomer({
      serviceID: serviceId,
      billersCode,
      type,
    });
    if (!isVerificationSuccess(result)) {
      return NextResponse.json(
        { error: result.response_description || "Could not verify this account" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      verified: true,
      customer_name: result.content?.Customer_Name || null,
      current_bouquet: result.content?.Current_Bouquet || null,
      renewal_amount: result.content?.Renewal_Amount || null,
    });
  } catch (error) {
    if (error instanceof VtpassError) {
      const status = error.status === 401 || error.status === 403 ? 502 : 503;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("VTpass customer verification error:", error);
    return NextResponse.json({ error: "Could not verify this account" }, { status: 502 });
  }
}
