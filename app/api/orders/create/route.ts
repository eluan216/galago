import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    // Load offer
    const { data: offer, error: offerErr } = await supabase
      .from("offers")
      .select("*, services(name, platform_id)")
      .eq("id", offer_id)
      .eq("is_active", true)
      .single();

    if (offerErr || !offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (quantity < offer.min_qty || quantity > offer.max_qty) {
      return NextResponse.json(
        {
          error: `Quantity must be between ${offer.min_qty} and ${offer.max_qty}`,
        },
        { status: 400 }
      );
    }

    const amountKobo = offer.rate_kobo * quantity;
    const key = idempotency_key || randomUUID();

    // Check for existing order with same idempotency key
    const { data: existing } = await supabase
      .from("orders")
      .select("id, status")
      .eq("idempotency_key", key)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ order_id: existing.id, status: existing.status });
    }

    // Get wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!wallet || wallet.balance_kobo < amountKobo) {
      return NextResponse.json(
        { error: "Insufficient balance. Please fund your wallet." },
        { status: 402 }
      );
    }

    // Hold funds (deduct immediately, record as hold)
    const newBalance = wallet.balance_kobo - amountKobo;

    const { error: walletErr } = await supabase
      .from("wallets")
      .update({ balance_kobo: newBalance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id)
      .eq("balance_kobo", wallet.balance_kobo); // optimistic lock

    if (walletErr) {
      return NextResponse.json(
        { error: "Could not hold funds. Try again." },
        { status: 409 }
      );
    }

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        offer_id,
        quantity,
        target_link: target_link || null,
        status: "held",
        amount_kobo: amountKobo,
        held_amount_kobo: amountKobo,
        idempotency_key: key,
        metadata: {
          service_name: (offer as any).services?.name,
          platform: (offer as any).services?.platform_id,
          rate_kobo: offer.rate_kobo,
        },
      })
      .select()
      .single();

    if (orderErr || !order) {
      // Rollback hold
      await supabase
        .from("wallets")
        .update({ balance_kobo: wallet.balance_kobo })
        .eq("id", wallet.id);

      console.error(orderErr);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Ledger: hold
    await supabase.from("ledger_entries").insert({
      wallet_id: wallet.id,
      user_id: user.id,
      type: "hold",
      amount_kobo: -amountKobo,
      balance_after_kobo: newBalance,
      reference_type: "order",
      reference_id: order.id,
      description: `Hold for order ${order.id.slice(0, 8)}`,
    });

    // Order event
    await supabase.from("order_events").insert({
      order_id: order.id,
      status: "held",
      note: "Funds held. Awaiting provider dispatch.",
    });

    // In production: dispatch to provider adapter here
    // For now leave as "held" / move to "processing" manually or via worker

    return NextResponse.json({
      order_id: order.id,
      status: order.status,
      amount_kobo: amountKobo,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
