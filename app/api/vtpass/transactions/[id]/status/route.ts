import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  classifyTransaction,
  requery,
  VtpassError,
} from "@/lib/vtpass";

export const runtime = "nodejs";

export async function POST(
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
    const admin = createAdminClient();
    const { data: transaction, error: transactionError } = await admin
      .from("vtpass_transactions")
      .select("id, request_id, amount_kobo, status, purchased_code")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.status !== "pending") {
      return NextResponse.json({
        transaction_id: transaction.id,
        request_id: transaction.request_id,
        amount_kobo: transaction.amount_kobo,
        status: transaction.status,
        purchased_code: transaction.purchased_code,
      });
    }

    const providerResponse = await requery(transaction.request_id);
    const status = classifyTransaction(providerResponse);
    const { data: resolved, error: resolveError } = await admin.rpc(
      "vtpass_resolve_purchase",
      {
        p_user_id: user.id,
        p_request_id: transaction.request_id,
        p_status: status,
        p_provider_code:
          providerResponse.code == null ? null : String(providerResponse.code),
        p_response_description: providerResponse.response_description || null,
        p_provider_transaction_id:
          providerResponse.content?.transactions?.transactionId || null,
        p_purchased_code:
          providerResponse.purchased_code || providerResponse.token || null,
      }
    );
    if (resolveError) {
      console.error("VTpass status update RPC:", resolveError);
      return NextResponse.json({ error: "Could not record provider status" }, { status: 500 });
    }

    const result = resolved as Record<string, unknown>;
    return NextResponse.json({
      transaction_id: transaction.id,
      request_id: transaction.request_id,
      amount_kobo: transaction.amount_kobo,
      status: result.status || status,
      purchased_code: result.purchased_code || null,
      message: providerResponse.response_description || null,
    });
  } catch (error) {
    if (error instanceof VtpassError) {
      const status = error.status === 401 || error.status === 403 ? 502 : 503;
      return NextResponse.json(
        {
          error: error.message,
          status: "pending",
        },
        { status }
      );
    }
    console.error("VTpass requery error:", error);
    return NextResponse.json({ error: "Could not check transaction status" }, { status: 502 });
  }
}
