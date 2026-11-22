/**
 * POST /api/crypto/webhook — NOWPayments IPN.
 * Credits Naira from amount_ngn_kobo locked at invoice time (USD face × rate).
 * Does not require pay_amount ≈ amount_crypto (breaks for BTC/ETH/etc.).
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

    const {
      order_id,
      payment_status,
      pay_amount,
      pay_currency,
      outcome_amount,
      price_amount,
      actually_paid,
    } = body;

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

    if (deposit.status === "confirmed") {
      return NextResponse.json({ ok: true });
    }

    if (payment_status === "finished" || payment_status === "confirmed") {
      const amountKobo = Number(deposit.amount_ngn_kobo);
      if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
        return NextResponse.json(
          { error: "Invalid deposit amount" },
          { status: 400 }
        );
      }

      // Soft check: invoice was priced in USD; reject wildly wrong price_amount if present
      const meta = (deposit.metadata || {}) as Record<string, unknown>;
      const expectedUsd = Number(meta.amount_usd ?? deposit.amount_crypto);
      const reportedPrice = Number(price_amount);
      if (
        Number.isFinite(expectedUsd) &&
        Number.isFinite(reportedPrice) &&
        reportedPrice > 0 &&
        Math.abs(reportedPrice - expectedUsd) > Math.max(1, expectedUsd * 0.15)
      ) {
        await supabase
          .from("crypto_deposits")
          .update({
            status: "failed",
            metadata: {
              ...meta,
              error: "Price amount mismatch",
              price_amount,
              pay_amount,
              pay_currency,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", deposit.id);
        return NextResponse.json(
          { error: "Price amount mismatch" },
          { status: 400 }
        );
      }

      const ticker =
        String(meta.ticker || deposit.currency || pay_currency || "CRYPTO").toUpperCase();

      const { data: result, error } = await supabase.rpc("credit_wallet", {
        p_user_id: deposit.user_id,
        p_amount_kobo: amountKobo,
        p_type: "crypto_deposit",
        p_reference_type: "crypto_deposit",
        p_reference_id: deposit.id,
        p_description: `${ticker} deposit via ${deposit.network || "crypto"}`,
        p_metadata: {
          provider: "nowpayments",
          pay_amount,
          pay_currency,
          actually_paid,
          outcome_amount,
          price_amount,
        },
      });
      if (error) {
        console.error("Crypto credit RPC:", error);
        return NextResponse.json(
          { error: "Wallet credit failed" },
          { status: 500 }
        );
      }
      if (!(result as Record<string, unknown>).ok) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 500 });
      }

      await supabase
        .from("crypto_deposits")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          amount_crypto: pay_amount || actually_paid || outcome_amount,
          currency: pay_currency || deposit.currency,
          updated_at: new Date().toISOString(),
          metadata: {
            ...meta,
            pay_amount,
            pay_currency,
            actually_paid,
            outcome_amount,
          },
        })
        .eq("id", deposit.id)
        .eq("status", "pending");
    } else if (payment_status === "expired" || payment_status === "failed") {
      await supabase
        .from("crypto_deposits")
        .update({
          status: payment_status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deposit.id);
    } else if (
      payment_status === "waiting" ||
      payment_status === "confirming" ||
      payment_status === "sending"
    ) {
      await supabase
        .from("crypto_deposits")
        .update({
          status: "confirming",
          updated_at: new Date().toISOString(),
        })
        .eq("id", deposit.id)
        .eq("status", "pending");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Crypto webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
