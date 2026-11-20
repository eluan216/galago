/**
 * POST /api/crypto/webhook
 * -----------------------
 * NOWPayments IPN (webhook).
 * When payment is confirmed we credit the user's Naira wallet and write a ledger entry.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyNowPaymentsIPN } from "@/lib/crypto/nowpayments";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-nowpayments-sig");
    const body = await req.json();

    if (!verifyNowPaymentsIPN(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { order_id, payment_status, pay_amount, pay_currency, outcome_amount } =
      body;

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: deposit } = await supabase
      .from("crypto_deposits")
      .select("*")
      .eq("id", order_id)
      .single();

    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    // Already processed — acknowledge and exit
    if (deposit.status === "confirmed") {
      return NextResponse.json({ ok: true });
    }

    if (payment_status === "finished" || payment_status === "confirmed") {
      const amountKobo = deposit.amount_ngn_kobo;
      const expectedUsdt = Number(deposit.amount_crypto);
      const receivedUsdt = Number(pay_amount);
      if (
        !Number.isFinite(receivedUsdt) ||
        !Number.isFinite(expectedUsdt) ||
        Math.abs(receivedUsdt - expectedUsdt) > 0.01
      ) {
        await supabase
          .from("crypto_deposits")
          .update({
            status: "failed",
            metadata: {
              ...deposit.metadata,
              error: "Paid amount mismatch",
              received_usdt: pay_amount,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", deposit.id);
        return NextResponse.json({ error: "Paid amount mismatch" }, { status: 400 });
      }

      const { data: result, error } = await supabase.rpc("credit_wallet", {
        p_user_id: deposit.user_id,
        p_amount_kobo: amountKobo,
        p_type: "crypto_deposit",
        p_reference_type: "crypto_deposit",
        p_reference_id: deposit.id,
        p_description: `USDT deposit via ${deposit.network}`,
        p_metadata: { provider: "nowpayments", pay_amount, pay_currency },
      });
      if (error) {
        console.error("Crypto credit RPC:", error);
        return NextResponse.json({ error: "Wallet credit failed" }, { status: 500 });
      }
      if (!(result as Record<string, unknown>).ok) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 500 });
      }

      await supabase
        .from("crypto_deposits")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          amount_crypto: pay_amount || outcome_amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deposit.id)
        .eq("status", "pending");
    } else if (payment_status === "expired" || payment_status === "failed") {
      await supabase
        .from("crypto_deposits")
        .update({ status: payment_status, updated_at: new Date().toISOString() })
        .eq("id", deposit.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Crypto webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
