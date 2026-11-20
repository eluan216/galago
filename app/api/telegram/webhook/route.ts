import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type TelegramUser = {
  id: number;
  username?: string;
};

type TelegramUpdate = {
  message?: {
    chat: { id: number; type: string };
    from?: TelegramUser;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: TelegramUser;
    data?: string;
    message?: { chat: { id: number; type: string } };
  };
};

type ChatState = {
  action?: "marketplace_order";
  step?: "quantity" | "target" | "confirm";
  offer_id?: string;
  offer_name?: string;
  rate_kobo?: number;
  quantity?: number;
  target_link?: string;
  idempotency_key?: string;
};

function isValidSecret(received: string | null, expected: string) {
  if (!received) return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return (
    receivedBytes.length === expectedBytes.length &&
    timingSafeEqual(receivedBytes, expectedBytes)
  );
}

async function telegram(method: string, payload: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error(`Telegram ${method} failed: ${result.description || response.status}`);
  }
  return result;
}

async function sendMessage(chatId: number, text: string, replyMarkup?: unknown) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function answerCallback(callbackId: string, text?: string) {
  await telegram("answerCallbackQuery", {
    callback_query_id: callbackId,
    ...(text ? { text } : {}),
  });
}

async function loadAccount(telegramUserId: string, chatId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("telegram_accounts")
    .select("user_id, chat_id")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();
  if (error) throw new Error(`Could not load Telegram account: ${error.message}`);
  if (!data || data.chat_id !== chatId) return null;
  return data;
}

async function getState(telegramUserId: string): Promise<ChatState> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("telegram_chat_sessions")
    .select("state")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();
  if (error) throw new Error(`Could not load Telegram chat state: ${error.message}`);
  return (data?.state || {}) as ChatState;
}

async function saveState(telegramUserId: string, state: ChatState) {
  const admin = createAdminClient();
  const { error } = await admin.from("telegram_chat_sessions").upsert({
    telegram_user_id: telegramUserId,
    state,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Could not save Telegram chat state: ${error.message}`);
}

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function informationalReply(text: string) {
  const value = text.toLowerCase();
  if (/\b(hello|hi|hey)\b/.test(value)) {
    return "Hi! I can help with Galago wallets, marketplace orders, airtime, bills, and eSIM plans. Send /help to see commands.";
  }
  if (value.includes("balance") || value.includes("wallet")) {
    return "Your Galago wallet is denominated in NGN. Link your account, then use /balance to check the available balance.";
  }
  if (value.includes("fund") || value.includes("deposit") || value.includes("payment")) {
    return "Fund your wallet from the Galago dashboard using the payment methods currently available to your account, including Paystack or USDT where enabled.";
  }
  if (value.includes("airtime") || value.includes("data") || value.includes("bill")) {
    return "Galago supports airtime, data, and eligible Nigerian bill payments. These purchases are completed in the Galago dashboard.";
  }
  if (value.includes("esim") || value.includes("e-sim") || value.includes("travel")) {
    return "Browse supported destinations and eSIM data plans in the Galago dashboard. Purchase availability depends on live provider configuration.";
  }
  if (value.includes("order") || value.includes("track") || value.includes("status")) {
    return "Use /orders to view recent marketplace orders, or check service-specific purchases in the Galago dashboard.";
  }
  if (value.includes("refund") || value.includes("failed")) {
    return "Refunds depend on the service and provider result. Check the order status in Galago; pending provider outcomes should be resolved before retrying a purchase.";
  }
  return null;
}

async function showOffers(chatId: number) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("offers")
    .select("id, name, rate_kobo, min_qty, max_qty")
    .eq("is_active", true)
    .order("name")
    .limit(40);
  if (error) throw new Error(`Could not load offers: ${error.message}`);
  if (!data?.length) {
    await sendMessage(chatId, "There are no marketplace offers available right now.");
    return;
  }

  const keyboard = data.map((offer) => [
    {
      text: `${offer.name} · ${formatNaira(offer.rate_kobo)}/unit`,
      callback_data: `offer:${offer.id}`,
    },
  ]);
  await sendMessage(chatId, "Choose a marketplace service to order:", {
    inline_keyboard: keyboard,
  });
}

async function handleLink(
  chatId: number,
  telegramUserId: string,
  username: string | undefined,
  command: string
) {
  const code = command.trim().split(/\s+/)[1];
  if (!code || !/^[A-Za-z0-9_-]{40,50}$/.test(code)) {
    await sendMessage(chatId, "Create a link code from your signed-in Galago dashboard, then send /link followed by that code.");
    return;
  }
  const tokenHash = createHash("sha256").update(code).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("link_telegram_account", {
    p_token_hash: tokenHash,
    p_telegram_user_id: telegramUserId,
    p_chat_id: String(chatId),
    p_username: username || null,
  });
  if (error) throw new Error(`Could not link Telegram account: ${error.message}`);
  const result = data as { ok?: boolean; code?: string };
  if (result.ok) {
    await saveState(telegramUserId, {});
    await sendMessage(chatId, "Your Telegram account is now linked to Galago. Use /balance to check your wallet or /order to place a marketplace order.");
  } else if (result.code === "telegram_already_linked") {
    await sendMessage(chatId, "This Telegram account is already linked to another Galago account. Contact Galago support if you need help.");
  } else {
    await sendMessage(chatId, "That link code is invalid, expired, or already used. Generate a new code from your Galago dashboard.");
  }
}

async function handleMessage(
  chatId: number,
  telegramUser: TelegramUser,
  text: string,
  chatType: string
) {
  if (chatType !== "private") {
    await sendMessage(chatId, "For account security, use Galago bot commands in a private chat.");
    return;
  }
  const telegramUserId = String(telegramUser.id);
  const command = text.trim();
  const lower = command.toLowerCase();

  if (lower === "/start" || lower.startsWith("/start ")) {
    await sendMessage(
      chatId,
      `Welcome to Galago. I can answer product questions, show your wallet balance, and help you place marketplace orders.\n\nTo connect your account, sign in at ${process.env.NEXT_PUBLIC_APP_URL || "your Galago website"}/dashboard/telegram and generate a one-time code. Then send /link followed by the code.`
    );
    return;
  }
  if (lower.startsWith("/link")) {
    await handleLink(chatId, telegramUserId, telegramUser.username, command);
    return;
  }
  if (lower === "/help") {
    await sendMessage(chatId, "Galago bot commands:\n/balance — check your NGN wallet balance\n/order — place a marketplace order\n/orders — see recent marketplace orders\n/services — see Galago services\n/cancel — cancel the current order flow\n\nLink your account from the Telegram section of your Galago dashboard.");
    return;
  }
  if (lower === "/services") {
    await sendMessage(chatId, "Galago offers marketplace orders, Nigerian airtime and bills, eSIM plans, wallet funding, and order tracking. Marketplace orders can be placed here with /order. Open your Galago dashboard to purchase airtime, bills, and eSIM plans.");
    return;
  }
  if (lower === "/cancel") {
    await saveState(telegramUserId, {});
    await sendMessage(chatId, "Order flow cancelled. No wallet funds were used.");
    return;
  }

  const activeState = command.startsWith("/")
    ? null
    : await getState(telegramUserId);
  if (!command.startsWith("/")) {
    const reply = activeState?.action ? null : informationalReply(command);
    if (reply) {
      await sendMessage(chatId, reply);
      return;
    }
  }

  const account = await loadAccount(telegramUserId, String(chatId));
  if (!account) {
    await sendMessage(chatId, "Link your Galago account first. Sign in to the dashboard, open Telegram, generate a one-time code, then send /link followed by the code.");
    return;
  }

  if (lower === "/balance") {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("wallets")
      .select("balance_kobo")
      .eq("user_id", account.user_id)
      .maybeSingle();
    if (error) throw new Error(`Could not load wallet balance: ${error.message}`);
    await sendMessage(chatId, `Available wallet balance: ${formatNaira(data?.balance_kobo ?? 0)} NGN.`);
    return;
  }

  if (lower === "/orders") {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select("id, status, quantity, amount_kobo, created_at")
      .eq("user_id", account.user_id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(`Could not load recent orders: ${error.message}`);
    if (!data?.length) {
      await sendMessage(chatId, "You have no marketplace orders yet. Send /order to browse available offers.");
      return;
    }
    await sendMessage(
      chatId,
      `Your recent marketplace orders:\n${data
        .map((order) => `${order.id.slice(0, 8)} · ${order.status} · ${order.quantity} units · ${formatNaira(order.amount_kobo)}`)
        .join("\n")}`
    );
    return;
  }

  if (lower === "/order") {
    await showOffers(chatId);
    return;
  }

  const state = activeState || await getState(telegramUserId);
  if (state.action === "marketplace_order" && state.step === "quantity") {
    const quantity = Number(command);
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      !state.offer_id ||
      !state.rate_kobo
    ) {
      await sendMessage(chatId, "Enter a whole number quantity for the selected offer, or send /cancel.");
      return;
    }
    const admin = createAdminClient();
    const { data: offer, error } = await admin
      .from("offers")
      .select("min_qty, max_qty")
      .eq("id", state.offer_id)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(`Could not validate offer: ${error.message}`);
    if (!offer || quantity < offer.min_qty || quantity > offer.max_qty) {
      await sendMessage(chatId, offer
        ? `Quantity must be between ${offer.min_qty} and ${offer.max_qty}. Send /cancel to stop.`
        : "That offer is no longer available. Send /order to choose another.");
      return;
    }
    await saveState(telegramUserId, { ...state, quantity, step: "target" });
    await sendMessage(chatId, "Send the target URL for this order (must start with http:// or https://). Send /cancel to stop.");
    return;
  }

  if (state.action === "marketplace_order" && state.step === "target") {
    let target: URL;
    try {
      target = new URL(command);
    } catch {
      await sendMessage(chatId, "Please send a valid http:// or https:// target URL.");
      return;
    }
    if (!["http:", "https:"].includes(target.protocol) || command.length > 2000) {
      await sendMessage(chatId, "Please send a valid http:// or https:// target URL (up to 2,000 characters).");
      return;
    }
    const nextState = { ...state, target_link: command, step: "confirm" as const };
    await saveState(telegramUserId, nextState);
    const total = (nextState.rate_kobo || 0) * (nextState.quantity || 0);
    await sendMessage(
      chatId,
      `Review your order:\n${nextState.offer_name}\nQuantity: ${nextState.quantity}\nTarget: ${command}\nTotal held: ${formatNaira(total)}\n\nConfirm to place the order. Funds are held according to the service workflow.`,
      {
        inline_keyboard: [[
          { text: "Confirm order", callback_data: "confirm_order" },
          { text: "Cancel", callback_data: "cancel_order" },
        ]],
      }
    );
    return;
  }

  await sendMessage(chatId, "I didn’t recognize that. Send /help to see what I can do.");
}

async function handleCallback(
  callbackId: string,
  telegramUser: TelegramUser,
  chatId: number,
  chatType: string,
  data: string
) {
  if (chatType !== "private") {
    await answerCallback(callbackId, "Use the bot in a private chat.");
    return;
  }
  const telegramUserId = String(telegramUser.id);
  const account = await loadAccount(telegramUserId, String(chatId));
  if (!account) {
    await answerCallback(callbackId, "Link your Galago account first.");
    return;
  }

  if (data.startsWith("offer:")) {
    const offerId = data.slice("offer:".length);
    const admin = createAdminClient();
    const { data: offer, error } = await admin
      .from("offers")
      .select("id, name, rate_kobo, min_qty, max_qty")
      .eq("id", offerId)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(`Could not load selected offer: ${error.message}`);
    if (!offer) {
      await answerCallback(callbackId, "Offer no longer available.");
      await sendMessage(chatId, "That offer is no longer available. Send /order to see current offers.");
      return;
    }
    await saveState(telegramUserId, {
      action: "marketplace_order",
      step: "quantity",
      offer_id: offer.id,
      offer_name: offer.name,
      rate_kobo: offer.rate_kobo,
      idempotency_key: randomUUID(),
    });
    await answerCallback(callbackId);
    await sendMessage(chatId, `${offer.name} costs ${formatNaira(offer.rate_kobo)} per unit. Enter a quantity from ${offer.min_qty} to ${offer.max_qty}.`);
    return;
  }

  if (data === "cancel_order") {
    await saveState(telegramUserId, {});
    await answerCallback(callbackId, "Cancelled");
    await sendMessage(chatId, "Order cancelled. No wallet funds were used.");
    return;
  }

  if (data === "confirm_order") {
    const state = await getState(telegramUserId);
    if (
      state.action !== "marketplace_order" ||
      state.step !== "confirm" ||
      !state.offer_id ||
      !state.quantity ||
      !state.idempotency_key
    ) {
      await answerCallback(callbackId, "Order details expired. Start again with /order.");
      return;
    }
    const admin = createAdminClient();
    const { data: result, error } = await admin.rpc("hold_order", {
      p_user_id: account.user_id,
      p_offer_id: state.offer_id,
      p_quantity: state.quantity,
      p_target_link: state.target_link || null,
      p_idempotency_key: state.idempotency_key,
    });
    if (error) throw new Error(`Could not place marketplace order: ${error.message}`);
    const outcome = result as Record<string, unknown>;
    if (outcome.ok !== true) {
      await answerCallback(callbackId);
      if (outcome.code === "insufficient_balance") {
        await sendMessage(chatId, "Insufficient wallet balance. Fund your Galago wallet before placing this order.");
      } else if (outcome.code === "invalid_quantity") {
        await sendMessage(chatId, `Quantity must be between ${outcome.min_qty} and ${outcome.max_qty}. Start again with /order.`);
      } else {
        await sendMessage(chatId, "Could not place this order. The offer may have changed; send /order to try again.");
      }
      await saveState(telegramUserId, {});
      return;
    }
    await answerCallback(callbackId, "Order placed");
    await sendMessage(chatId, `Order placed successfully.\nOrder ID: ${String(outcome.order_id || "").slice(0, 8)}\nAmount held: ${formatNaira(Number(outcome.amount_kobo || 0))}\n\nTrack it in your Galago dashboard or send /orders.`);
    await saveState(telegramUserId, {});
    return;
  }

  await answerCallback(callbackId, "This action is no longer available.");
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("TELEGRAM_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Telegram webhook is not configured" }, { status: 503 });
  }
  if (!isValidSecret(request.headers.get("x-telegram-bot-api-secret-token"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update = (await request.json()) as TelegramUpdate;
    if (update.message?.from && update.message.text) {
      await handleMessage(
        update.message.chat.id,
        update.message.from,
        update.message.text,
        update.message.chat.type
      );
    } else if (
      update.callback_query?.from &&
      update.callback_query.message?.chat &&
      update.callback_query.data
    ) {
      await handleCallback(
        update.callback_query.id,
        update.callback_query.from,
        update.callback_query.message.chat.id,
        update.callback_query.message.chat.type,
        update.callback_query.data
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Could not process Telegram update" }, { status: 500 });
  }
}
