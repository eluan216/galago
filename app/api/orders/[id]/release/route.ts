/**
 * POST /api/orders/[id]/release
 * held | processing → failed + credit wallet (release hold).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: result, error } = await admin.rpc("release_order", {
      p_user_id: user.id,
      p_order_id: id,
    });
    if (error) {
      console.error("release_order RPC:", error);
      return NextResponse.json({ error: "Failed to release" }, { status: 500 });
    }
    const value = result as Record<string, unknown>;
    if (!value.ok) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(value);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Failed to release",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
