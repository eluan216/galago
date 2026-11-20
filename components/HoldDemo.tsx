"use client";

import { useState, useCallback } from "react";

function naira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

export function HoldDemo() {
  const [av, setAv] = useState(48250);
  const [hd, setHd] = useState(0);
  const [sd, setSd] = useState(0);
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState(
    "Illustration only. Try a ₦3,200 hold — no real money or provider order."
  );
  const [msgColor, setMsgColor] = useState("");
  const [fail, setFail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [btnLabel, setBtnLabel] = useState("Place order");

  const run = useCallback(() => {
    if (busy) return;
    setBusy(true);
    setAv(48250);
    setHd(0);
    setSd(0);
    setStep(1);
    setMsgColor("");
    setMsg("Funding wallet…");

    window.setTimeout(() => {
      setAv(45050);
      setHd(3200);
      setStep(2);
      setMsg("₦3,200 held for IG · 1k followers. Waiting for delivery.");
    }, 600);

    window.setTimeout(() => {
      if (fail) {
        setAv(48250);
        setHd(0);
        setSd(0);
        setMsg("Delivery failed. ₦3,200 released. Nothing was charged.");
        setMsgColor("var(--rel)");
      } else {
        setAv(45050);
        setHd(0);
        setSd(3200);
        setMsg("Delivered. The hold became a charge.");
        setMsgColor("var(--li)");
      }
      setStep(3);
      setBusy(false);
      setBtnLabel("Run it again");
    }, 3200);
  }, [busy, fail]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start mt-12">
      <div>
        {[
          {
            n: 1,
            title: "Fund",
            body: "Use a currently available payment method. Successful deposits appear in your wallet.",
          },
          {
            n: 2,
            title: "Order",
            body: "For hold-based marketplace orders, the exact amount is reserved while delivery is pending.",
          },
          {
            n: 3,
            title: "Settle",
            body: "A confirmed delivery settles the reserve. A confirmed failure releases it.",
          },
        ].map((s) => (
          <div
            key={s.n}
            className={`grid grid-cols-[62px_1fr] py-5 border-t-2 transition-opacity ${
              step === s.n
                ? "opacity-100 border-[var(--li)]"
                : "opacity-55 border-white/35"
            }`}
          >
            <b className="text-[52px] font-black text-[var(--li)] leading-none">
              {s.n}
            </b>
            <div>
              <h3 className="text-[30px] font-black uppercase tracking-tight mb-1.5">
                {s.title}
              </h3>
              <p className="m-0 text-[#e7e5ff] text-[15px] leading-relaxed">
                {s.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-7">
        <div className="flex justify-between items-baseline py-3.5 border-t border-white/25 first:border-0">
          <span className="font-semibold">Available</span>
          <output className="text-4xl font-black tracking-tight tabular-nums">
            {naira(av)}
          </output>
        </div>
        <div className="flex justify-between items-baseline py-3.5 border-t border-white/25">
          <span className="font-semibold">Held</span>
          <output className="text-4xl font-black tracking-tight tabular-nums text-[var(--hold)]">
            {naira(hd)}
          </output>
        </div>
        <div className="flex justify-between items-baseline py-3.5 border-t border-white/25">
          <span className="font-semibold">Settled</span>
          <output className="text-4xl font-black tracking-tight tabular-nums text-[var(--li)]">
            {naira(sd)}
          </output>
        </div>
        <div
          className="min-h-[54px] my-3 font-medium"
          style={{ color: msgColor || undefined }}
          aria-live="polite"
        >
          {msg}
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <button
            type="button"
            className="btn-galago"
            disabled={busy}
            onClick={run}
          >
            {btnLabel}
          </button>
          <label className="flex gap-2.5 items-center cursor-pointer font-semibold">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={fail}
              onChange={(e) => setFail(e.target.checked)}
            />
            <span className="relative w-[46px] h-[26px] rounded-full bg-white/30 peer-checked:bg-[var(--rel)] after:content-[''] after:absolute after:left-[3px] after:top-[3px] after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
            Delivery fails
          </label>
        </div>
        <p className="mt-5 mb-0 text-sm text-[#e7e5ff]">
          This illustration covers hold-based marketplace orders. Bill payments
          and eSIM purchases use product-specific provider and refund workflows.
        </p>
      </div>
    </div>
  );
}
