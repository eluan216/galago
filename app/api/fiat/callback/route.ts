import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaystackTransaction } from "@/lib/paystack";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference") || req.nextUrl.searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(
      new URL("/dashboard/wallet?error=missing_ref", req.url)
    );
  }

  try {
    const tx = await verifyPaystackTransaction(reference);

    if (tx.status !== "success") {
      return NextResponse.redirect(
        new URL("/dashboard/wallet?error=payment_failed", req.url)
      );
    }

    const userId = tx.metadata?.user_id as string;
    const amountKobo = (tx.metadata?.amount_kobo as number) || tx.amount;

    if (!userId) {
      return NextResponse.redirect(
        new URL("/dashboard/wallet?error=invalid_meta", req.url)
      );
    }

    const supabase = getServiceClient();

    // Idempotency: check if we already credited this reference
    const { data: existing } = await supabase
      .from("ledger_entries")
      .select("id")
      .eq("reference_type", "fiat_deposit")
      .eq("description", `Paystack ${reference}`)
      .maybeSingle();

    if (existing) {
      return NextResponse.redirect(
        new URL("/dashboard/wallet?deposit=success", req.url)
      );
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!wallet) {
      return NextResponse.redirect(
        new URL("/dashboard/wallet?error=no_wallet", req.url)
      );
    }

    const newBalance = wallet.balance_kobo + amountKobo;

    await supabase
      .from("wallets")
      .update({ balance_kobo: newBalance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);

    await supabase.from("ledger_entries").insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: "fund_fiat",
      amount_kobo: amountKobo,
      balance_after_kobo: newBalance,
      reference_type: "fiat_deposit",
      description: `Paystack ${reference}`,
      metadata: { provider: "paystack", reference, paid_at: tx.paid_at },
    });

    return NextResponse.redirect(
      new URL("/dashboard/wallet?deposit=success", req.url)
    );
  } catch (err) {
    console.error("Paystack callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/wallet?error=verify_failed", req.url)
    );
  }
}
