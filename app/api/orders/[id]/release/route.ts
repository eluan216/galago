/**
 * POST /api/orders/[id]/release
 * held | processing → failed + credit wallet (release hold).
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
        { error: `Cannot release order in status ${order.status}` },
        { status: 400 }
      );
    }

    const releaseKobo = order.held_amount_kobo ?? order.amount_kobo ?? 0;

    const { data: wallet } = await admin
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 500 });
    }

    const newBalance = wallet.balance_kobo + releaseKobo;

    await admin
      .from("wallets")
      .update({
        balance_kobo: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wallet.id);

    await admin
      .from("orders")
      .update({
        status: "failed",
        held_amount_kobo: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    await admin.from("ledger_entries").insert({
      wallet_id: wallet.id,
      user_id: user.id,
      type: "release",
      amount_kobo: releaseKobo,
      balance_after_kobo: newBalance,
      reference_type: "order",
      reference_id: id,
      description: `Released hold for order ${id.slice(0, 8)}`,
    });

    await admin.from("order_events").insert({
      order_id: id,
      status: "failed",
      note: "Hold released — funds returned to wallet",
    });

    return NextResponse.json({
      ok: true,
      status: "failed",
      released_kobo: releaseKobo,
      balance_after_kobo: newBalance,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Failed to release",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
