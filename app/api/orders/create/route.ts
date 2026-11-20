/**
 * POST /api/orders/create
 * Hold funds → create order status "held" → ledger "hold".
 * Uses service role for writes (RLS is select-only on wallets/orders/ledger).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { offer_id, quantity, target_link, idempotency_key } = body;

    if (!offer_id || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "offer_id and quantity are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const key = idempotency_key || randomUUID();
    const { data: result, error } = await admin.rpc("hold_order", {
      p_user_id: user.id,
      p_offer_id: offer_id,
      p_quantity: quantity,
      p_target_link: target_link || null,
      p_idempotency_key: key,
    });
    if (error) {
      console.error("hold_order RPC:", error);
      return NextResponse.json({ error: "Could not hold funds" }, { status: 500 });
    }
    const value = result as Record<string, unknown>;
    if (!value.ok) {
      const code = value.code;
      if (code === "offer_not_found") return NextResponse.json({ error: "Offer not found" }, { status: 404 });
      if (code === "invalid_quantity") {
        return NextResponse.json({ error: `Quantity must be between ${value.min_qty} and ${value.max_qty}` }, { status: 400 });
      }
      if (code === "insufficient_balance") {
        return NextResponse.json({ error: "Insufficient balance. Fund your wallet first.", need_kobo: value.need_kobo, balance_kobo: value.balance_kobo }, { status: 402 });
      }
      return NextResponse.json({ error: "Could not hold funds" }, { status: 400 });
    }
    return NextResponse.json(value);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
