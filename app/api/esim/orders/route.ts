import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: orders, error } = await createAdminClient()
      .from("esim_orders")
      .select(
        "id, transaction_id, provider_order_no, package_code, package_name, location_code, provider_price_units, provider_currency, charge_kobo, status, provider_error, profiles, created_at, updated_at, provider_cancel_confirmed_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("eSIM order history query:", error);
      return NextResponse.json({ error: "Could not load eSIM orders" }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error("eSIM order history error:", error);
    return NextResponse.json({ error: "Could not load eSIM orders" }, { status: 500 });
  }
}
