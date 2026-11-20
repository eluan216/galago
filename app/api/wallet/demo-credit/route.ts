/**
 * POST /api/wallet/demo-credit
 * Credits ₦5,000 for testing the order loop when real payments are not used.
 * Only works when DEMO_CREDIT_ENABLED=true in Vercel env.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEMO_KOBO = 500_000; // ₦5,000

export async function POST() {
  try {
    if (process.env.DEMO_CREDIT_ENABLED !== "true") {
      return NextResponse.json(
        {
          error:
            "Demo credit is off. Set DEMO_CREDIT_ENABLED=true in Vercel, or fund with Paystack/USDT.",
        },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    let { data: wallet } = await admin
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      const { data: created, error } = await admin
        .from("wallets")
        .insert({ user_id: user.id, balance_kobo: 0, currency: "NGN" })
        .select()
        .single();
      if (error || !created) {
        return NextResponse.json(
          { error: "Could not create wallet", detail: error?.message },
          { status: 500 }
        );
      }
      wallet = created;
    }

    const newBalance = wallet.balance_kobo + DEMO_KOBO;

    await admin
      .from("wallets")
      .update({
        balance_kobo: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wallet.id);

    await admin.from("ledger_entries").insert({
      wallet_id: wallet.id,
      user_id: user.id,
      type: "fund_fiat",
      amount_kobo: DEMO_KOBO,
      balance_after_kobo: newBalance,
      reference_type: "demo",
      description: "Demo credit for testing hold → settle loop",
    });

    return NextResponse.json({
      ok: true,
      credited_kobo: DEMO_KOBO,
      balance_kobo: newBalance,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Demo credit failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
