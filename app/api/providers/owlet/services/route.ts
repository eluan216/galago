/**
 * GET /api/providers/owlet/services
 * Fetch live Owlet catalogue (server-side key). Auth required.
 * Use to map service ids → offers.provider_code.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOwletEnabled, owletServices } from "@/lib/providers/owlet";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isOwletEnabled()) {
      return NextResponse.json(
        {
          error:
            "Owlet is off. Set OWLET_API_KEY + OWLET_ENABLED=true and redeploy.",
        },
        { status: 503 }
      );
    }

    const services = await owletServices();
    return NextResponse.json({
      count: services.length,
      services: services.map((s) => ({
        id: s.service,
        name: s.name,
        category: s.category,
        type: s.type,
        rate: s.rate,
        min: Number(s.min),
        max: Number(s.max),
        refill: s.refill,
        cancel: s.cancel,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Failed to load provider services",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
