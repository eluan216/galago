/**
 * POST /api/orders/[id]/complete
 * held | processing → completed (settle). Funds already deducted on hold.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    if (!["held", "processing", "partial"].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot complete order in status ${order.status}` },
        { status: 400 }
      );
    }

    await admin
      .from("orders")
      .update({
        status: "completed",
        delivered_qty: order.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    const { data: wallet } = await admin
      .from("wallets")
      .select("id, balance_kobo")
      .eq("user_id", user.id)
      .single();

    if (wallet) {
      await admin.from("ledger_entries").insert({
        wallet_id: wallet.id,
        user_id: user.id,
        type: "settle",
        amount_kobo: 0,
        balance_after_kobo: wallet.balance_kobo,
        reference_type: "order",
        reference_id: id,
        description: `Settled order ${id.slice(0, 8)} — delivery confirmed`,
      });
    }

    await admin.from("order_events").insert({
      order_id: id,
      status: "completed",
      note: "Order marked completed (settle)",
    });

    return NextResponse.json({ ok: true, status: "completed" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Failed to complete",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
