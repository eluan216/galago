/** GET /api/providers/owlet/balance — Owlet wallet (auth required). */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOwletEnabled, owletBalance } from "@/lib/providers/owlet";

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
      return NextResponse.json({ error: "Owlet not enabled" }, { status: 503 });
    }
    const bal = await owletBalance();
    return NextResponse.json(bal);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Balance check failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
