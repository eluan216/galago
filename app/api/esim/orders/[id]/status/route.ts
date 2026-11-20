import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EsimAccessError,
  queryProfiles,
} from "@/lib/esimaccess";
import { isProfileReady } from "@/lib/esim-lifecycle";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const admin = createAdminClient();
    const { data: order, error } = await admin
      .from("esim_orders")
      .select("id, transaction_id, provider_order_no, charge_kobo, status, profiles")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "eSIM order not found" }, { status: 404 });
    }
    if (order.status !== "pending") {
      return NextResponse.json(order);
    }
    if (!order.provider_order_no) {
      return NextResponse.json({
        ...order,
        message:
          "The provider has not returned an order reference yet. This order remains pending and must not be purchased again.",
      });
    }

    const result = await queryProfiles(order.provider_order_no);
    const delivered =
      !result.pending &&
      result.profiles.length === 1 &&
      result.profiles.every(isProfileReady);
    const { data: resolved, error: resolveError } = await admin.rpc(
      "esim_update_purchase",
      {
        p_user_id: user.id,
        p_transaction_id: order.transaction_id,
        p_status: delivered ? "delivered" : "pending",
        p_provider_order_no: order.provider_order_no,
        p_provider_error: delivered
          ? null
          : "Provider accepted the order; profile allocation is not confirmed yet.",
        p_profiles: delivered ? result.profiles : null,
      }
    );
    if (resolveError || (resolved as Record<string, unknown> | null)?.ok !== true) {
      console.error("eSIM status update RPC:", resolveError || resolved);
      return NextResponse.json(
        { error: "Could not record eSIM fulfilment status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...(resolved as Record<string, unknown>),
      id: order.id,
      transaction_id: order.transaction_id,
      amount_kobo: order.charge_kobo,
      status: delivered ? "delivered" : "pending",
      message: delivered
        ? "eSIM profile is ready."
        : "Profile allocation is still pending.",
    });
  } catch (error) {
    if (error instanceof EsimAccessError) {
      return NextResponse.json(
        { error: error.message, status: "pending" },
        { status: 503 }
      );
    }
    console.error("eSIM status check error:", error);
    return NextResponse.json(
      { error: "Could not check eSIM order status" },
      { status: 500 }
    );
  }
}
