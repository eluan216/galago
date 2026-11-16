import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initializePaystackTransaction } from "@/lib/paystack";
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
    const { amount_ngn } = body;

    if (!amount_ngn || amount_ngn < 100) {
      return NextResponse.json(
        { error: "Minimum deposit is ₦100" },
        { status: 400 }
      );
    }

    const amountKobo = Math.round(amount_ngn * 100);
    const reference = `galago_${user.id.slice(0, 8)}_${randomUUID().slice(0, 12)}`;

    // Record pending deposit (we can reuse crypto_deposits pattern or a fiat_deposits table later)
    // For simplicity we use a ledger pending approach via metadata on success

    const init = await initializePaystackTransaction({
      email: user.email!,
      amount_kobo: amountKobo,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/fiat/callback`,
      metadata: {
        user_id: user.id,
        amount_kobo: amountKobo,
        type: "wallet_fund",
      },
    });

    return NextResponse.json({
      authorization_url: init.authorization_url,
      reference: init.reference,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
