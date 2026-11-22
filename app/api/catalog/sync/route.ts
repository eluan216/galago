/**
 * POST /api/catalog/sync
 * Pull Owlet's live service list and upsert it into platforms → services →
 * offers at Owlet's rate + 10%. Throttled to once every 6 hours; safe to call
 * on every visit to the new-order page.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwletEnabled, owletServices } from "@/lib/providers/owlet";
import { buildCatalogPlan } from "@/lib/providers/owlet-catalog";
import { getUsdRates } from "@/lib/fx-rates";

export const maxDuration = 60;

const SYNC_TTL_MS = 6 * 60 * 60 * 1000;
const OFFER_CHUNK = 400;
const FALLBACK_NGN_PER_USD = 1600;

/**
 * Owlet quotes in USD; Galago sells in naira. Take the higher of the
 * configured rate and the live market USD→NGN rate so a stale configuration
 * can never price a service below Owlet's cost + 10%.
 */
async function ngnPerUsd() {
  const configured = Number(
    process.env.OWLET_NGN_RATE || process.env.USDT_NGN_RATE || 0
  );
  let market = 0;
  try {
    const { usdRates } = await getUsdRates();
    market = Number(usdRates.NGN) || 0;
  } catch {
    // Fall back to the configured rate below.
  }
  const candidates = [configured, market].filter(
    (n) => Number.isFinite(n) && n > 0
  );
  return candidates.length ? Math.max(...candidates) : FALLBACK_NGN_PER_USD;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: lastRun } = await admin
      .from("catalog_sync")
      .select("synced_at, service_count")
      .eq("provider", "owlet")
      .maybeSingle();

    if (lastRun?.synced_at) {
      const age = Date.now() - Date.parse(lastRun.synced_at);
      if (Number.isFinite(age) && age >= 0 && age < SYNC_TTL_MS) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          offers: lastRun.service_count,
          synced_at: lastRun.synced_at,
        });
      }
    }

    if (!isOwletEnabled()) {
      return NextResponse.json(
        {
          error:
            "Live catalogue is off. Set OWLET_API_KEY + OWLET_ENABLED=true.",
        },
        { status: 503 }
      );
    }

    const fx = await ngnPerUsd();
    const live = await owletServices();
    const plan = buildCatalogPlan(live, fx);

    if (plan.offers.length === 0) {
      return NextResponse.json(
        { error: "Owlet returned no orderable services" },
        { status: 502 }
      );
    }

    const { error: platformError } = await admin
      .from("platforms")
      .upsert(plan.platforms, { onConflict: "id" });
    if (platformError) throw platformError;

    const { data: serviceRows, error: serviceError } = await admin
      .from("services")
      .upsert(plan.services, { onConflict: "platform_id,name" })
      .select("id, name, platform_id");
    if (serviceError) throw serviceError;

    const serviceIds = new Map<string, string>();
    for (const row of serviceRows ?? []) {
      serviceIds.set(`${row.platform_id}|${row.name}`, row.id);
    }

    const offers = plan.offers.flatMap((offer) => {
      const serviceId = serviceIds.get(offer.service_key);
      if (!serviceId) return [];
      const { service_key: _serviceKey, ...rest } = offer;
      return [{ ...rest, service_id: serviceId }];
    });

    for (let i = 0; i < offers.length; i += OFFER_CHUNK) {
      const { error } = await admin
        .from("offers")
        .upsert(offers.slice(i, i + OFFER_CHUNK), {
          onConflict: "provider_code",
        });
      if (error) throw error;
    }

    await admin.from("catalog_sync").upsert(
      {
        provider: "owlet",
        synced_at: new Date().toISOString(),
        service_count: offers.length,
        fx_rate: fx,
        note: `${plan.platforms.length} platforms, ${plan.services.length} services`,
      },
      { onConflict: "provider" }
    );

    return NextResponse.json({
      ok: true,
      skipped: false,
      platforms: plan.platforms.length,
      services: plan.services.length,
      offers: offers.length,
      fx_rate: fx,
      synced_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("catalog sync:", err);
    return NextResponse.json(
      {
        error: "Catalogue sync failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
