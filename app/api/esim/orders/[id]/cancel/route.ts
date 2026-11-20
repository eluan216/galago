import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  cancelProfile,
  EsimAccessError,
  esimErrorMessage,
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
      .select(
        "id, transaction_id, provider_order_no, status, profiles, provider_cancel_confirmed_at"
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error || !order) {
      return NextResponse.json({ error: "eSIM order not found" }, { status: 404 });
    }
    if (order.status === "cancelled") {
      return NextResponse.json({ status: "cancelled", refunded: true });
    }
    if (order.status !== "delivered" || !order.provider_order_no) {
      return NextResponse.json(
        { error: "Only delivered eSIM orders can be considered for cancellation" },
        { status: 409 }
      );
    }

    if (!order.provider_cancel_confirmed_at) {
      const current = await queryProfiles(order.provider_order_no);
      if (current.pending || current.profiles.length !== 1) {
        return NextResponse.json(
          { error: "The provider could not confirm that this eSIM is cancellable" },
          { status: 409 }
        );
      }
      const profile = current.profiles[0];
      if (
        !isProfileReady(profile) ||
        profile.orderUsage !== 0 ||
        !profile.esimTranNo
      ) {
        return NextResponse.json(
          {
            error:
              "This provider profile is used, installed, or not confirmed active; no wallet refund was made.",
          },
          { status: 409 }
        );
      }

      const cancellation = await cancelProfile(profile.esimTranNo);
      if (!cancellation.success) {
        return NextResponse.json(
          { error: esimErrorMessage(cancellation, "Cancelling eSIM profile") },
          { status: 502 }
        );
      }

      const { data: confirmed, error: confirmError } = await admin.rpc(
        "esim_mark_cancel_confirmed",
        {
          p_user_id: user.id,
          p_transaction_id: order.transaction_id,
        }
      );
      if (confirmError || !(confirmed as Record<string, unknown>)?.ok) {
        console.error("eSIM cancellation confirmation RPC:", confirmError || confirmed);
        return NextResponse.json(
          {
            error:
              "The provider confirmed cancellation, but Galago could not record it. Retry reconciliation before contacting support.",
            status: "pending_refund",
          },
          { status: 202 }
        );
      }
    }

    const { data: refunded, error: refundError } = await admin.rpc(
      "esim_cancel_purchase",
      {
        p_user_id: user.id,
        p_transaction_id: order.transaction_id,
      }
    );
    if (refundError || !(refunded as Record<string, unknown>)?.ok) {
      console.error("eSIM cancellation refund RPC:", refundError || refunded);
      return NextResponse.json(
        {
          error:
            "Provider cancellation is confirmed, but the wallet refund is still reconciling.",
          status: "pending_refund",
        },
        { status: 202 }
      );
    }

    return NextResponse.json({ status: "cancelled", refunded: true });
  } catch (error) {
    if (error instanceof EsimAccessError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("eSIM cancellation error:", error);
    return NextResponse.json(
      { error: "Could not cancel eSIM order" },
      { status: 500 }
    );
  }
}
