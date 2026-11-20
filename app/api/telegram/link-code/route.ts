import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(code).digest("hex");
  const admin = createAdminClient();
  const { error: revokeError } = await admin
    .from("telegram_link_tokens")
    .delete()
    .eq("user_id", user.id);
  if (revokeError) {
    console.error("Could not revoke previous Telegram link codes:", revokeError);
    return NextResponse.json({ error: "Could not create link code" }, { status: 500 });
  }
  const { error } = await admin.from("telegram_link_tokens").insert({
    token_hash: tokenHash,
    user_id: user.id,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  if (error) {
    console.error("Could not create Telegram link code:", error);
    return NextResponse.json({ error: "Could not create link code" }, { status: 500 });
  }

  return NextResponse.json({
    code,
    expires_in_seconds: 600,
    bot_username: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || null,
  });
}
