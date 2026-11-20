"use client";

import { useState } from "react";

export default function TelegramPage() {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);

  async function createCode() {
    setLoading(true);
    setError(null);
    setCode(null);
    try {
      const response = await fetch("/api/telegram/link-code", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create link code");
      setCode(data.code);
      setBotUsername(data.bot_username);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not create link code");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(`/link ${code}`);
      setCopied(true);
    } catch {
      setError("Could not copy the command. Select and copy the code manually.");
    }
  }

  return (
    <section className="max-w-xl space-y-5 text-white">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Telegram bot</h1>
        <p className="mt-2 text-sm text-white/70">
          Connect your Galago account to check your wallet and place marketplace orders in Telegram.
        </p>
      </div>

      <div className="space-y-4 rounded-[22px] bg-white p-5 text-[var(--ink)] shadow-[0_10px_30px_rgba(10,5,90,0.15)]">
        <ol className="list-inside list-decimal space-y-2 text-sm">
          <li>
            Start a private chat with the Galago bot
            {botUsername && (
              <> (<a className="font-bold text-[var(--bl)] underline" href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer">@{botUsername}</a>)</>
            )}
            .
          </li>
          <li>Generate a one-time code below and send the shown <code>/link</code> command to the bot.</li>
          <li>The code expires in 10 minutes and can only be used once.</li>
        </ol>

        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        {code && (
          <div className="rounded-xl border border-[var(--ink)]/15 bg-[var(--of)] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--mu)]">
              One-time command · expires in 10 minutes
            </p>
            <code className="block break-all text-sm">/link {code}</code>
            <button type="button" onClick={copyCode} className="btn-galago btn-galago-sm mt-4">
              {copied ? "Copied" : "Copy command"}
            </button>
          </div>
        )}

        <button type="button" onClick={createCode} disabled={loading} className="btn-galago">
          {loading ? "Generating…" : code ? "Generate a new code" : "Generate link code"}
        </button>
      </div>
    </section>
  );
}
