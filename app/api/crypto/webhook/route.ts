import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyNowPaymentsIPN } from "@/lib/crypto/nowpayments";

// Service role client for webhook (bypasses RLS)
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

    const { order_id, payment_status, pay_amount, pay_currency, outcome_amount } = body;

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
      // Already processed
      return NextResponse.json({ ok: true });
    }

    if (payment_status === "finished" || payment_status === "confirmed") {
      // Credit the wallet
      const amountKobo = deposit.amount_ngn_kobo;

      // Get wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", deposit.user_id)
        .single();

      if (!wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 500 });
      }

      const newBalance = wallet.balance_kobo + amountKobo;

      // Update wallet
      await supabase
        .from("wallets")
        .update({ balance_kobo: newBalance, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);

      // Ledger entry
      await supabase.from("ledger_entries").insert({
        wallet_id: wallet.id,
        user_id: deposit.user_id,
        type: "crypto_deposit",
        amount_kobo: amountKobo,
        balance_after_kobo: newBalance,
        reference_type: "crypto_deposit",
        reference_id: deposit.id,
        description: `USDT deposit via ${deposit.network}`,
        metadata: { provider: "nowpayments", pay_amount, pay_currency },
      });

      // Mark deposit confirmed
      await supabase
        .from("crypto_deposits")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          amount_crypto: pay_amount || outcome_amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deposit.id);
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