/**
 * GET /api/fiat/callback
 * ---------------------
 * Paystack redirects here after payment.
 * We verify the transaction, credit the wallet once (idempotent), and redirect the user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaystackTransaction } from "@/lib/paystack";

// Service-role client bypasses RLS so we can credit any user's wallet from the callback
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const reference =
    req.nextUrl.searchParams.get("reference") ||
    req.nextUrl.searchParams.get("trxref");

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
    if (!Number.isInteger(amountKobo) || amountKobo <= 0 || tx.amount !== amountKobo) {
      return NextResponse.redirect(
        new URL("/dashboard/wallet?error=amount_mismatch", req.url)
      );
    }

    const supabase = getServiceClient();

    const { data: result, error } = await supabase.rpc("credit_wallet", {
      p_user_id: userId,
      p_amount_kobo: amountKobo,
      p_type: "fund_fiat",
      p_reference_type: "fiat_deposit",
      p_reference_id: null,
      p_description: `Paystack ${reference}`,
      p_metadata: { provider: "paystack", reference, paid_at: tx.paid_at },
    });
    if (error) {
      console.error("Fiat credit RPC:", error);
      return NextResponse.redirect(
        new URL("/dashboard/wallet?error=credit_failed", req.url)
      );
    }
    if (!(result as Record<string, unknown>).ok) {
      return NextResponse.redirect(
        new URL("/dashboard/wallet?error=no_wallet", req.url)
      );
    }

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
