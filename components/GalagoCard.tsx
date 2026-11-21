"use client";

import { useEffect, useState } from "react";
import { GalagoMark } from "@/components/logo";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

export function GalagoCard({
  balanceKobo,
  displayName,
}: {
  balanceKobo: number;
  displayName: string;
}) {
  const [hidden, setHidden] = useState(false);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(balanceKobo);
      return;
    }
    const start = performance.now();
    const from = 0;
    const to = balanceKobo;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / 900, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (to - from) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [balanceKobo]);

  return (
    <div className="galago-card relative aspect-[1.62/1] rounded-[28px] overflow-hidden shadow-[0_24px_50px_rgba(8,4,80,0.45)]">
      <div className="absolute -right-[8%] -top-[30%] w-[62%] aspect-square rounded-full bg-[var(--li)]" />
      <div
        className="absolute right-0 bottom-0 w-[48%] h-[58%] bg-[var(--ink)]"
        style={{
          clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
        }}
      />
      <div className="absolute left-[6%] top-[7%] right-[6%] flex justify-between items-center text-white font-bold text-[12px] tracking-[0.1em] uppercase">
        <span className="flex items-center gap-2">
          <GalagoMark className="w-7 h-7" />
          Galago Card
        </span>
        <span className="text-[var(--ink)] bg-white rounded-full px-2.5 py-0.5 text-[11px] normal-case tracking-normal font-bold">
          NGN
        </span>
      </div>
      <div className="galago-card-pane absolute left-[5%] right-[5%] bottom-[6%] h-[55%] rounded-[20px] px-[6%] flex items-center justify-between text-white">
        <div>
          <small className="block text-[13px] font-medium text-white/90">
            Available balance
          </small>
          <output
            className="block text-[clamp(30px,8.4vw,42px)] font-extrabold tracking-tight leading-tight my-0.5 tabular-nums"
            aria-live="polite"
          >
            {hidden ? "₦•••••" : formatNaira(shown)}
          </output>
          <div className="text-[14px] font-semibold">{displayName}</div>
        </div>
        <button
          type="button"
          className="w-11 h-11 rounded-full border-0 bg-[var(--ink)] grid place-items-center shrink-0 hover:bg-black transition"
          aria-pressed={hidden}
          aria-label={hidden ? "Show balance" : "Hide balance"}
          onClick={() => setHidden((h) => !h)}
        >
          {hidden ? (
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-6 0-10-8-10-8a18.45 18.45 0 015.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c6 0 10 8 10 8a18.5 18.5 0 01-2.16 3.19" />
              <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
