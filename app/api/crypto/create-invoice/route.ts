/**
 * POST /api/crypto/create-invoice
 * -------------------------------
 * Creates a NOWPayments invoice so the user can fund their wallet with USDT.
 * On confirmation the webhook credits the Naira balance.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNowPaymentsInvoice } from "@/lib/crypto/nowpayments";

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
    const { amount_ngn, network = "TRC20" } = body;

    if (!amount_ngn || amount_ngn < 1000) {
      return NextResponse.json(
        { error: "Minimum deposit is ₦1,000" },
        { status: 400 }
      );
    }

    // Record a pending deposit first so we have an order_id for the invoice
    const { data: deposit, error } = await supabase
      .from("crypto_deposits")
      .insert({
        user_id: user.id,
        provider: "nowpayments",
        network,
        currency: "USDT",
        amount_ngn_kobo: Math.round(amount_ngn * 100),
        status: "pending",
      })
      .select()
      .single();

    if (error || !deposit) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to create deposit record" },
        { status: 500 }
      );
    }

    // Rough USD conversion for the invoice (replace with live rate later)
    const approxUsd = amount_ngn / 1600;

    const invoice = await createNowPaymentsInvoice({
      price_amount: approxUsd,
      price_currency: "usd",
      pay_currency: network === "TRC20" ? "usdttrc20" : "usdterc20",
      order_id: deposit.id,
      order_description: `Galago wallet top-up ₦${amount_ngn}`,
      ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/crypto/webhook`,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?deposit=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?deposit=cancelled`,
    });

    // Store the invoice details on the deposit row
    await supabase
      .from("crypto_deposits")
      .update({
        external_id: String(invoice.id),
        pay_url: invoice.invoice_url,
        metadata: invoice,
      })
      .eq("id", deposit.id);

    return NextResponse.json({
      deposit_id: deposit.id,
      pay_url: invoice.invoice_url,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
