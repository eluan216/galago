"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, Send, Sparkles } from "lucide-react";

type ChatMessage = {
  id: number;
  role: "bot" | "user";
  text: string;
};

const quickReplies = [
  "What can I buy?",
  "How do I fund my wallet?",
  "Track an order",
];

function getReply(message: string) {
  const text = message.toLowerCase();

  if (text.includes("fund") || text.includes("deposit") || text.includes("payment")) {
    return "Open your wallet and choose a currently available funding method, such as Paystack or USDT (where available). Your balance updates after the deposit is confirmed.";
  }
  if (text.includes("track") || text.includes("status") || text.includes("order")) {
    return "You can follow provider and transaction updates from your Galago dashboard. Open the Orders section to view an order's latest status.";
  }
  if (text.includes("bill") || text.includes("electric") || text.includes("tv")) {
    return "Galago supports eligible Nigerian bill payments, including electricity and TV services. Availability depends on the provider and can vary by account.";
  }
  if (text.includes("esim") || text.includes("travel") || text.includes("sim")) {
    return "Browse supported destinations and eSIM data plans in the app. Before purchase, compare the destination, data allowance and validity period.";
  }
  if (text.includes("airtime") || text.includes("data") || text.includes("mobile")) {
    return "You can purchase airtime and supported mobile data plans for Nigerian networks. Select the network and enter the recipient number in the dashboard.";
  }
  if (text.includes("refund") || text.includes("failed") || text.includes("fail")) {
    return "If a purchase fails, provider status is reflected in your order. Any applicable refund or release follows the payment and fulfilment workflow for that service.";
  }
  if (text.includes("buy") || text.includes("service") || text.includes("hello") || text.includes("hi")) {
    return "I can help you explore airtime, data, bill payments, eSIM plans and order tracking. What would you like to do?";
  }
  return "I can help with wallets, funding, airtime, data, bill payments, eSIMs and order status. Try asking about one of those, or open the dashboard for live account options.";
}

export function GalagoChat() {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "bot",
      text: "Hi, I’m Gigi. I can help you find services, fund your wallet, or track an order.",
    },
  ]);
  const messageId = useRef(2);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, typing]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    setMessages((current) => [
      ...current,
      { id: messageId.current++, role: "user", text: trimmed },
    ]);
    setInput("");
    setTyping(true);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: messageId.current++, role: "bot", text: getReply(trimmed) },
      ]);
      setTyping(false);
    }, 550);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
      {open && (
        <section
          role="dialog"
          aria-label="Galago chat"
          aria-modal="false"
          className="absolute bottom-[78px] right-0 flex h-[min(580px,calc(100vh-120px))] w-[calc(100vw-32px)] max-w-[390px] flex-col overflow-hidden rounded-[24px] border-2 border-[var(--ink)] bg-white text-[var(--ink)] shadow-[0_18px_50px_rgba(10,5,90,0.38)]"
        >
          <header className="flex items-center gap-3 border-b-2 border-[var(--ink)] bg-[var(--bl)] px-4 py-3 text-white">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[var(--ink)] bg-[var(--li)] text-[var(--ink)]">
              <Bot size={21} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black uppercase tracking-wide">Gigi</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#e7e5ff]">
                <span className="h-2 w-2 rounded-full bg-[var(--li)]" />
                Galago assistant
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/30 transition hover:bg-white/15"
              aria-label="Close chat"
            >
              <ChevronDown size={20} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-[var(--of)] px-4 py-4">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-[var(--mu)]">
              <Sparkles size={13} className="text-[var(--bl)]" />
              Galago help
            </div>

            <div className="space-y-3" aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-3 text-[13px] leading-relaxed ${
                      message.role === "user"
                        ? "rounded-br-md bg-[var(--bl)] text-white"
                        : "rounded-bl-md border border-[var(--ink)]/10 bg-white shadow-[0_3px_12px_rgba(15,11,59,0.06)]"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-[0_3px_12px_rgba(15,11,59,0.06)]">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--bl)]"
                        style={{ animationDelay: `${dot * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {messages.length === 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => sendMessage(reply)}
                    className="rounded-full border border-[var(--bl)] bg-white px-3 py-2 text-xs font-bold text-[var(--bl)] transition hover:bg-[var(--li)] hover:text-[var(--ink)]"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[var(--ink)]/10 bg-white p-3">
            <form onSubmit={submit} className="flex items-center gap-2">
              <label htmlFor="galago-chat-input" className="sr-only">
                Ask Galago
              </label>
              <input
                id="galago-chat-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask Gigi anything..."
                autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-full border-2 border-[var(--ink)]/15 px-4 text-sm outline-none transition placeholder:text-[var(--mu)] focus:border-[var(--bl)]"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[var(--ink)] bg-[var(--li)] text-[var(--ink)] shadow-[0_3px_0_var(--ink)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={18} strokeWidth={2.5} />
              </button>
            </form>
            <Link
              href="/dashboard"
              className="mt-2 block text-center text-[11px] font-bold text-[var(--mu)] hover:text-[var(--bl)]"
            >
              Open Galago dashboard
            </Link>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group relative flex h-[62px] items-center gap-2.5 rounded-full border-2 border-[var(--ink)] bg-[var(--li)] px-3.5 text-[var(--ink)] shadow-[0_7px_0_var(--ink),0_12px_28px_rgba(10,5,90,0.32)] transition hover:-translate-y-1 hover:shadow-[0_9px_0_var(--ink),0_16px_32px_rgba(10,5,90,0.32)]"
        aria-label={open ? "Close Galago chat" : "Open Galago chat"}
        aria-expanded={open}
      >
        <span className="relative grid h-10 w-10 place-items-center rounded-full border-2 border-[var(--ink)] bg-white">
          {open ? <ChevronDown size={21} /> : <Bot size={22} strokeWidth={2.5} />}
          {!open && (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[var(--li)] bg-[var(--bl)]" />
          )}
        </span>
        <span className="hidden pr-1 text-left sm:block">
          <span className="block text-[10px] font-black uppercase tracking-[0.12em] opacity-70">
            Need help?
          </span>
          <span className="block text-sm font-black">Chat with Gigi</span>
        </span>
      </button>
    </div>
  );
}
