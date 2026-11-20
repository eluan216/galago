import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCategories,
  getProducts,
  getVariations,
  VtpassError,
} from "@/lib/vtpass";

export const runtime = "nodejs";

const SUPPORTED_CATEGORIES = new Set([
  "airtime",
  "data",
  "electricity-bill",
  "tv-subscription",
  "education",
]);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const category = request.nextUrl.searchParams.get("category");
    const serviceId = request.nextUrl.searchParams.get("service_id");

    if (!category) {
      const categories = await getCategories();
      return NextResponse.json({
        categories: categories.filter((item) =>
          SUPPORTED_CATEGORIES.has(item.identifier)
        ),
      });
    }
    if (!SUPPORTED_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Unsupported service category" }, { status: 400 });
    }

    const products = await getProducts(category);
    if (!serviceId) {
      return NextResponse.json({
        products: products.map((product) => ({
          serviceID: product.serviceID,
          name: product.name,
          minimum_amount: product.minimum_amount ?? product.minimium_amount,
          maximum_amount: product.maximum_amount,
          product_type: product.product_type,
        })),
      });
    }

    const product = products.find((item) => item.serviceID === serviceId);
    if (!product) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const variations = await getVariations(serviceId);
    return NextResponse.json({
      variations: variations.map((variation) => ({
        variation_code: variation.variation_code,
        name: variation.name,
        variation_amount: variation.variation_amount,
        fixedPrice: variation.fixedPrice,
      })),
    });
  } catch (error) {
    if (error instanceof VtpassError) {
      const status = error.status === 401 || error.status === 403 ? 502 : 503;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("VTpass catalog error:", error);
    return NextResponse.json({ error: "Could not load VTpass catalog" }, { status: 502 });
  }
}
