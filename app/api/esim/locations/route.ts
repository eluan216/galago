import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLocations } from "@/lib/esimaccess";

export const runtime = "nodejs";

export async function GET() {
  try {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      locations: await getLocations(),
      purchases_enabled: process.env.ESIM_ACCESS_PURCHASES_ENABLED === "true",
    });
  } catch (error) {
    console.error("eSIM locations error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load destinations" },
      { status: 502 }
    );
  }
}
