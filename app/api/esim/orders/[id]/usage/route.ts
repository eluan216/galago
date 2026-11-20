import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  esimErrorMessage,
  queryUsage,
} from "@/lib/esimaccess";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { data: order, error } = await createAdminClient()
      .from("esim_orders")
      .select("status, profiles")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error || !order) {
      return NextResponse.json({ error: "eSIM order not found" }, { status: 404 });
    }
    if (order.status !== "delivered" || !Array.isArray(order.profiles)) {
      return NextResponse.json(
        { error: "Usage is available after the eSIM profile is delivered" },
        { status: 409 }
      );
    }

    const profileIds = order.profiles
      .map((profile) => (profile as { esimTranNo?: string }).esimTranNo)
      .filter((value): value is string => Boolean(value));
    if (profileIds.length === 0) {
      return NextResponse.json(
        { error: "The provider has not returned an eSIM profile reference" },
        { status: 409 }
      );
    }

    const response = await queryUsage(profileIds);
    if (!response.success || !response.obj) {
      return NextResponse.json(
        { error: esimErrorMessage(response, "Checking eSIM usage") },
        { status: 502 }
      );
    }
    return NextResponse.json({
      usage: response.obj.esimUsageList || [],
    });
  } catch (error) {
    console.error("eSIM usage query error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load eSIM usage" },
      { status: 502 }
    );
  }
}
