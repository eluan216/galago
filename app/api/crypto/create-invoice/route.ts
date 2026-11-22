/**
 * POST /api/crypto/create-invoice
 * Body: { amount_usd: number, pay_currency: string }
 * Legacy: amount_usdt (+ optional network TRC20|ERC20)
 * Min $10. Credits Naira after webhook (USD × USDT_NGN_RATE).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createNowPaymentsInvoice } from "@/lib/crypto/nowpayments";
import {
  findPayOption,
  MIN_USD_DEPOSIT,
} from "@/lib/crypto/currencies";

function ngnRate(): number {
  const r = Number(process.env.USDT_NGN_RATE || process.env.USD_NGN_RATE || "1600");
  return r > 0 ? r : 1600;
}

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }
    if (!process.env.NOWPAYMENTS_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Server missing NOWPAYMENTS_API_KEY — add it in Vercel env and redeploy",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Preferred: amount_usd. Legacy: amount_usdt / amount_ngn
    let amountUsd = Number(body.amount_usd);
    if (!amountUsd && body.amount_usdt) amountUsd = Number(body.amount_usdt);
    if (!amountUsd && body.amount_ngn) {
      amountUsd = Number(body.amount_ngn) / ngnRate();
    }

    if (!amountUsd || Number.isNaN(amountUsd) || amountUsd < MIN_USD_DEPOSIT) {
      return NextResponse.json(
        { error: `Minimum deposit is $${MIN_USD_DEPOSIT} USD equivalent` },
        { status: 400 }
      );
    }

    amountUsd = Math.round(amountUsd * 100) / 100;

    // Resolve pay currency
    let payId = String(body.pay_currency || "").toLowerCase().trim();
    if (!payId && body.network) {
      // Legacy USDT network selector
      payId = body.network === "ERC20" ? "usdterc20" : "usdttrc20";
    }
    if (!payId) payId = "usdttrc20";

    const option = findPayOption(payId);
    if (!option) {
      return NextResponse.json(
        { error: "Unsupported pay currency" },
        { status: 400 }
      );
    }

    const rate = ngnRate();
    const amountNgnKobo = Math.round(amountUsd * rate * 100);

    const admin = serviceDb();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://galago-swart.vercel.app";

    const { data: deposit, error: insertError } = await admin
      .from("crypto_deposits")
      .insert({
        user_id: user.id,
        provider: "nowpayments",
        network: option.network,
        currency: option.ticker,
        amount_ngn_kobo: amountNgnKobo,
        amount_crypto: amountUsd, // USD face value until IPN fills actual coin amount
        status: "pending",
        metadata: {
          amount_usd: amountUsd,
          rate_ngn: rate,
          pay_currency: option.id,
          ticker: option.ticker,
        },
      })
      .select("id")
      .single();

    if (insertError || !deposit) {
      console.error("crypto_deposits insert:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create deposit record",
          detail: insertError?.message || insertError?.code || "unknown",
        },
        { status: 500 }
      );
    }

    try {
      const invoice = await createNowPaymentsInvoice({
        price_amount: amountUsd,
        price_currency: "usd",
        pay_currency: option.id,
        order_id: deposit.id,
        order_description: `Galago wallet top-up $${amountUsd} via ${option.label}`,
        ipn_callback_url: `${appUrl}/api/crypto/webhook`,
        success_url: `${appUrl}/dashboard/wallet?deposit=success`,
        cancel_url: `${appUrl}/dashboard/wallet?deposit=cancelled`,
      });

      await admin
        .from("crypto_deposits")
        .update({
          external_id: String(invoice.id),
          pay_url: invoice.invoice_url,
          metadata: {
            amount_usd: amountUsd,
            rate_ngn: rate,
            pay_currency: option.id,
            ticker: option.ticker,
            invoice,
          },
        })
        .eq("id", deposit.id);

      return NextResponse.json({
        deposit_id: deposit.id,
        pay_url: invoice.invoice_url,
        amount_usd: amountUsd,
        amount_ngn_kobo: amountNgnKobo,
        pay_currency: option.id,
        ticker: option.ticker,
        network: option.network,
      });
    } catch (invoiceErr) {
      const msg =
        invoiceErr instanceof Error ? invoiceErr.message : String(invoiceErr);
      console.error("NOWPayments invoice:", msg);
      await admin
        .from("crypto_deposits")
        .update({ status: "failed", metadata: { error: msg } })
        .eq("id", deposit.id);
      return NextResponse.json(
        { error: "Failed to create invoice", detail: msg },
        { status: 502 }
      );
    }
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
