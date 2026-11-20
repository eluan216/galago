import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrencyCatalog, getUsdRates } from "@/lib/fx-rates";

export const runtime = "nodejs";

export async function GET() {
  try {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [catalog, rates] = await Promise.all([
      getCurrencyCatalog(),
      getUsdRates(),
    ]);
    const currencies = catalog.filter(
      (currency) => rates.usdRates[currency.code] !== undefined
    );

    return NextResponse.json(
      { currencies, rates: rates.usdRates, updated_at: rates.updatedAt },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Currency rates error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load exchange rates",
      },
      { status: 503 }
    );
  }
}
