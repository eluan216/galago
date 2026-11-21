/**
 * POST /api/orders/create
 * 1) hold_order RPC (wallet hold + order row)
 * 2) If offer.provider_code is an Owlet service id and OWLET_ENABLED → dispatch
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";
import {
  isOwletEnabled,
  isOwletServiceCode,
  owletAddOrder,
} from "@/lib/providers/owlet";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { offer_id, quantity, target_link, idempotency_key } = body;

    if (!offer_id || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "offer_id and quantity are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const key = idempotency_key || randomUUID();
    const { data: result, error } = await admin.rpc("hold_order", {
      p_user_id: user.id,
      p_offer_id: offer_id,
      p_quantity: quantity,
      p_target_link: target_link || null,
      p_idempotency_key: key,
    });
    if (error) {
      console.error("hold_order RPC:", error);
      return NextResponse.json(
        { error: "Could not hold funds" },
        { status: 500 }
      );
    }
    const value = result as Record<string, unknown>;
    if (!value.ok) {
      const code = value.code;
      if (code === "offer_not_found")
        return NextResponse.json({ error: "Offer not found" }, { status: 404 });
      if (code === "invalid_quantity") {
        return NextResponse.json(
          {
            error: `Quantity must be between ${value.min_qty} and ${value.max_qty}`,
          },
          { status: 400 }
        );
      }
      if (code === "insufficient_balance") {
        return NextResponse.json(
          {
            error: "Insufficient balance. Fund your wallet first.",
            need_kobo: value.need_kobo,
            balance_kobo: value.balance_kobo,
          },
          { status: 402 }
        );
      }
      return NextResponse.json({ error: "Could not hold funds" }, { status: 400 });
    }

    const orderId = String(value.order_id || value.id || "");
    let provider: Record<string, unknown> = { dispatched: false };

    // Dispatch to Owlet when enabled and offer is mapped
    if (orderId && isOwletEnabled()) {
      const { data: offer } = await admin
        .from("offers")
        .select("provider_code, name")
        .eq("id", offer_id)
        .single();

      const code = offer?.provider_code;
      if (isOwletServiceCode(code) && target_link) {
        try {
          const { orderId: owletOrderId } = await owletAddOrder({
            service: Number(code),
            link: String(target_link),
            quantity: Number(quantity),
          });

          await admin
            .from("orders")
            .update({
              status: "processing",
              provider_order_id: owletOrderId,
              metadata: {
                ...(typeof value.metadata === "object" && value.metadata
                  ? (value.metadata as object)
                  : {}),
                provider: "owlet",
                owlet_service: Number(code),
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          await admin.from("order_events").insert({
            order_id: orderId,
            status: "processing",
            note: `Dispatched to provider · ref ${owletOrderId}`,
          });

          provider = {
            dispatched: true,
            provider: "owlet",
            provider_order_id: owletOrderId,
          };
        } catch (dispatchErr) {
          const msg =
            dispatchErr instanceof Error
              ? dispatchErr.message
              : String(dispatchErr);
          console.error("Owlet dispatch failed:", msg);
          await admin.from("order_events").insert({
            order_id: orderId,
            status: "held",
            note: `Provider dispatch failed (held for retry): ${msg.slice(0, 200)}`,
          });
          provider = {
            dispatched: false,
            error: msg.slice(0, 300),
          };
        }
      } else if (isOwletServiceCode(code) && !target_link) {
        provider = {
          dispatched: false,
          error: "target_link required for provider dispatch",
        };
      }
    }

    return NextResponse.json({
      ...value,
      provider,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
