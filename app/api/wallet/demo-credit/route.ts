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
    const { data: result, error } = await admin.rpc("credit_wallet", {
      p_user_id: user.id,
      p_amount_kobo: DEMO_KOBO,
      p_type: "fund_fiat",
      p_reference_type: "demo_credit",
      p_reference_id: null,
      p_description: "Demo credit for testing hold → settle loop",
      p_metadata: { one_time: true },
    });
    if (error) {
      console.error("demo credit RPC:", error);
      return NextResponse.json({ error: "Demo credit failed" }, { status: 500 });
    }
    const value = result as Record<string, unknown>;
    if (value.already_processed) {
      return NextResponse.json(
        { error: "Demo credit has already been claimed for this account" },
        { status: 409 }
      );
    }
    if (!value.ok) {
      return NextResponse.json({ error: "Demo credit failed" }, { status: 500 });
    }
    return NextResponse.json(value);
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
