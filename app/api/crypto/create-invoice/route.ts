/**
 * POST /api/crypto/create-invoice
 * Body: { amount_usdt: number, network?: "TRC20" }
 * Min 10 USDT. Creates crypto_deposits row + NOWPayments invoice.
 * Credits Naira wallet after webhook (USDT × USDT_NGN_RATE).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createNowPaymentsInvoice } from "@/lib/crypto/nowpayments";

const MIN_USDT = 10;

function ngnRate(): number {
  const r = Number(process.env.USDT_NGN_RATE || "1600");
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
        { error: "Server missing NOWPAYMENTS_API_KEY — add it in Vercel env and redeploy" },
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
    // Accept amount_usdt (preferred) or legacy amount_ngn for one release
    let amountUsdt = Number(body.amount_usdt);
    if (!amountUsdt && body.amount_ngn) {
      amountUsdt = Number(body.amount_ngn) / ngnRate();
    }
    const network = body.network === "ERC20" ? "ERC20" : "TRC20";

    if (!amountUsdt || Number.isNaN(amountUsdt) || amountUsdt < MIN_USDT) {
      return NextResponse.json(
        { error: `Minimum deposit is ${MIN_USDT} USDT` },
        { status: 400 }
      );
    }

    // Round to 2 decimals for invoice
    amountUsdt = Math.round(amountUsdt * 100) / 100;

    const rate = ngnRate();
    const amountNgnKobo = Math.round(amountUsdt * rate * 100);

    const admin = serviceDb();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://galago-eluanatein-ogumas-projects.vercel.app";

    // Service role insert — avoids RLS blocking user inserts on crypto_deposits
    const { data: deposit, error: insertError } = await admin
      .from("crypto_deposits")
      .insert({
        user_id: user.id,
        provider: "nowpayments",
        network,
        currency: "USDT",
        amount_ngn_kobo: amountNgnKobo,
        amount_crypto: amountUsdt,
        status: "pending",
        metadata: { amount_usdt: amountUsdt, rate_ngn: rate },
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
        price_amount: amountUsdt,
        price_currency: "usd",
        pay_currency: network === "TRC20" ? "usdttrc20" : "usdterc20",
        order_id: deposit.id,
        order_description: `Galago wallet top-up ${amountUsdt} USDT`,
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
            amount_usdt: amountUsdt,
            rate_ngn: rate,
            invoice,
          },
        })
        .eq("id", deposit.id);

      return NextResponse.json({
        deposit_id: deposit.id,
        pay_url: invoice.invoice_url,
        amount_usdt: amountUsdt,
        amount_ngn_kobo: amountNgnKobo,
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
