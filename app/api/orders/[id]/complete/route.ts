import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Simple complete endpoint (admin / system use).
 * Moves order from held/processing → completed and converts the hold into a settle.
 * In production this is called by provider webhooks.
 */
export async function POST(
  req: NextRequest,
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

    // For now allow the order owner (later restrict to admin/service role)
    const { data: order } = await supabase
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

    // Mark completed (funds already deducted as hold → now it is settled)
    await supabase
      .from("orders")
      .update({
        status: "completed",
        delivered_qty: order.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Ledger settle note (optional informational entry)
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance_kobo")
      .eq("user_id", user.id)
      .single();

    if (wallet) {
      await supabase.from("ledger_entries").insert({
        wallet_id: wallet.id,
        user_id: user.id,
        type: "settle",
        amount_kobo: 0, // already deducted
        balance_after_kobo: wallet.balance_kobo,
        reference_type: "order",
        reference_id: id,
        description: `Settled order ${id.slice(0, 8)}`,
      });
    }

    await supabase.from("order_events").insert({
      order_id: id,
      status: "completed",
      note: "Order marked completed",
    });

    return NextResponse.json({ ok: true, status: "completed" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
