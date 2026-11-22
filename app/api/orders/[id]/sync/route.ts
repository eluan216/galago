/**
 * POST /api/orders/[id]/sync
 * Poll Owlet status for this order and settle / release / mark processing.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isOwletEnabled,
  mapOwletStatus,
  owletOrderStatus,
} from "@/lib/providers/owlet";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isOwletEnabled()) {
      return NextResponse.json(
        { error: "Provider sync is not enabled" },
        { status: 503 }
      );
    }

    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (["completed", "failed"].includes(order.status)) {
      return NextResponse.json({
        ok: true,
        status: order.status,
        message: "Order already final",
      });
    }

    if (!order.provider_order_id) {
      return NextResponse.json(
        {
          error: "No provider order id — manual Settle/Release or re-dispatch",
          status: order.status,
        },
        { status: 400 }
      );
    }

    const remote = await owletOrderStatus(order.provider_order_id);
    if (remote.error) {
      return NextResponse.json(
        { error: remote.error, provider_status: remote },
        { status: 502 }
      );
    }

    const mapped = mapOwletStatus(remote.status);

    if (mapped.action === "settle_partial") {
      // Owlet reports how much it could not deliver in `remains`, and refunds
      // that part to the Owlet wallet. Charge only what landed and return the
      // rest of the hold to the customer.
      const remains = Number(remote.remains);
      const delivered = Number.isFinite(remains)
        ? Math.min(
            order.quantity,
            Math.max(0, order.quantity - Math.floor(remains))
          )
        : null;

      if (delivered !== null && delivered < order.quantity) {
        const { data: result, error } = await admin.rpc(
          "settle_partial_order",
          {
            p_user_id: user.id,
            p_order_id: id,
            p_delivered_qty: delivered,
          }
        );
        if (error) {
          return NextResponse.json(
            { error: "Partial settle failed", detail: error.message },
            { status: 500 }
          );
        }
        return NextResponse.json({
          ok: true,
          action: "settle_partial",
          delivered_qty: delivered,
          ordered_qty: order.quantity,
          provider: remote,
          result,
        });
      }

      // No usable `remains` — fall through to a full settle rather than
      // guessing at a delivery count.
    }

    if (mapped.action === "settle" || mapped.action === "settle_partial") {
      const { data: result, error } = await admin.rpc("complete_order", {
        p_user_id: user.id,
        p_order_id: id,
      });
      if (error) {
        return NextResponse.json(
          { error: "Settle failed", detail: error.message },
          { status: 500 }
        );
      }
      await admin.from("order_events").insert({
        order_id: id,
        status: "completed",
        note: `Provider status ${mapped.raw} → settled`,
      });
      return NextResponse.json({
        ok: true,
        action: "settle",
        provider: remote,
        result,
      });
    }

    if (mapped.action === "release") {
      const { data: result, error } = await admin.rpc("release_order", {
        p_user_id: user.id,
        p_order_id: id,
      });
      if (error) {
        return NextResponse.json(
          { error: "Release failed", detail: error.message },
          { status: 500 }
        );
      }
      await admin.from("order_events").insert({
        order_id: id,
        status: "failed",
        note: `Provider status ${mapped.raw} → hold released`,
      });
      return NextResponse.json({
        ok: true,
        action: "release",
        provider: remote,
        result,
      });
    }

    if (mapped.action === "processing" && order.status !== "processing") {
      await admin
        .from("orders")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", id);
    }

    return NextResponse.json({
      ok: true,
      action: mapped.action,
      status: order.status,
      provider: remote,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Sync failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
