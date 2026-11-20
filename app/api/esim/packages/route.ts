import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPackages,
} from "@/lib/esimaccess";
import { providerPriceToNgnKobo } from "@/lib/esim-pricing";
import { getUsdRates } from "@/lib/fx-rates";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locationCode = request.nextUrl.searchParams.get("locationCode") || "";
    if (!/^[A-Za-z0-9_-]{2,20}$/.test(locationCode)) {
      return NextResponse.json({ error: "Choose a valid destination" }, { status: 400 });
    }

    const [packages, rates] = await Promise.all([
      getPackages(locationCode),
      getUsdRates(),
    ]);

    return NextResponse.json({
      packages: packages.map((item) => ({
        ...item,
        charge_kobo: providerPriceToNgnKobo(
          item.price,
          item.currencyCode,
          rates.usdRates
        ),
      })),
      rates_updated_at: rates.updatedAt,
    });
  } catch (error) {
    console.error("eSIM packages error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load eSIM packages" },
      { status: 502 }
    );
  }
}
