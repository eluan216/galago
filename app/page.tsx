import Link from "next/link";
import { GalagoMark, GalagoWordmark } from "@/components/logo";

/**
 * Galago product landing
 * Direction: nocturnal restraint + real product surface
 * Background: night-ops (dot grid, vignette, one gold ambient)
 * Signature: bushbaby mark + hold-until-delivered + wallet mock
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-night-ops text-moon relative">
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-white/[0.06] bg-night/70 backdrop-blur-md px-5 sm:px-8 h-14 flex items-center justify-between sticky top-0 z-20">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <GalagoWordmark />
          </Link>
          <nav className="flex items-center gap-3 text-[13px]">
            <Link
              href="/auth/signin"
              className="text-mist hover:text-moon transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="text-night bg-moon px-3.5 py-1.5 rounded-full font-medium hover:bg-white transition-colors"
            >
              Open wallet
            </Link>
          </nav>
        </header>

        {/* Hero — copy + live product panel */}
        <section className="px-5 sm:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="text-[11px] text-mist tracking-wide">
                  Live · Naira + USDT wallet
                </span>
              </div>

              <h1 className="text-[2.4rem] sm:text-[3rem] font-semibold tracking-[-0.035em] leading-[1.06] text-moon max-w-[12ch]">
                Grow while you sleep
              </h1>

              <p className="mt-5 text-[15px] leading-relaxed text-mist max-w-md">
                One wallet for social delivery, airtime, virtual numbers, and
                cards. Fund with Paystack or USDT. We hold funds until the order
                actually lands.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center bg-gold text-night text-[13px] font-semibold px-6 py-2.5 rounded-full hover:brightness-110 transition"
                >
                  Open your wallet
                </Link>
                <Link
                  href="/auth/signin"
                  className="text-[13px] text-mist hover:text-moon transition-colors px-2"
                >
                  Already have one? Sign in
                </Link>
              </div>

              <p className="mt-6 text-[12px] text-mist/80">
                Built for Nigerian resellers · Hold-until-delivered ledger
              </p>
            </div>

            {/* Product mock — wallet surface */}
            <div className="lg:col-span-6">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute -inset-4 rounded-2xl opacity-40 blur-2xl"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 20%, rgba(232,185,35,0.18), transparent 55%)",
                  }}
                />
                <div className="relative surface overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <GalagoMark className="w-5 h-5" />
                      <span className="text-[12px] font-medium text-moon">
                        Wallet
                      </span>
                    </div>
                    <span className="text-[11px] text-mist tabular-nums">
                      kobo ledger
                    </span>
                  </div>

                  <div className="px-5 pt-6 pb-5">
                    <p className="text-[11px] text-mist tracking-wide">
                      Available balance
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-moon tabular-nums">
                      ₦48,250
                    </p>
                    <p className="mt-1 text-[12px] text-mist">
                      2 holds · ₦6,400 reserved
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-white/[0.08] bg-night/40 px-3 py-2.5">
                        <p className="text-[10px] text-mist">Fund Naira</p>
                        <p className="text-[12px] font-medium text-moon mt-0.5">
                          Paystack
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/[0.08] bg-night/40 px-3 py-2.5">
                        <p className="text-[10px] text-mist">Fund crypto</p>
                        <p className="text-[12px] font-medium text-moon mt-0.5">
                          USDT · TRC20
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] px-5 py-3 space-y-2.5">
                    {[
                      ["Hold", "IG followers × 1k", "−₦3,200"],
                      ["Fund", "Paystack", "+₦20,000"],
                      ["Settle", "VTU · MTN 2GB", "−₦1,150"],
                    ].map(([type, label, amount]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between text-[12px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-mist w-12 shrink-0">{type}</span>
                          <span className="text-moon truncate">{label}</span>
                        </div>
                        <span
                          className={`tabular-nums shrink-0 ${
                            amount.startsWith("+")
                              ? "text-success"
                              : "text-moon"
                          }`}
                        >
                          {amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-white/[0.06] bg-night/40">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex flex-wrap gap-x-8 gap-y-2 text-[12px] text-mist">
            <span>Hold until delivered</span>
            <span className="hidden sm:inline text-white/20">·</span>
            <span>Kobo-precise ledger</span>
            <span className="hidden sm:inline text-white/20">·</span>
            <span>Paystack + USDT</span>
            <span className="hidden sm:inline text-white/20">·</span>
            <span>Nigeria-first</span>
          </div>
        </section>

        {/* Product truth */}
        <section className="px-5 sm:px-8 py-14 sm:py-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-7 surface p-6 sm:p-7">
              <p className="text-[11px] text-gold tracking-wide font-medium">
                The contract
              </p>
              <h2 className="mt-2 text-[18px] font-medium text-moon tracking-tight">
                Hold until delivered
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-mist max-w-lg">
                Place an order and the exact amount is reserved on your ledger.
                Nothing settles until delivery confirms. If it fails, the hold
                releases. That is how Galago moves money — not a slogan.
              </p>
            </div>
            <div className="md:col-span-5 grid grid-cols-1 gap-5">
              <div className="surface p-5">
                <h3 className="text-[14px] font-medium text-moon">One balance</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-mist">
                  Fund once with Naira or USDT. Spend across social, VTU,
                  numbers, and cards.
                </p>
              </div>
              <div className="surface p-5">
                <h3 className="text-[14px] font-medium text-moon">Night ops</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-mist">
                  Orders keep moving after you close the laptop. Built for
                  bushbaby hours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog */}
        <section className="border-t border-white/[0.06] px-5 sm:px-8 py-14 sm:py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[13px] font-medium text-mist mb-6">
              What runs on Galago
            </h2>
            <ul className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {[
                [
                  "Social delivery",
                  "Followers, likes, views — tiered quality, held until real",
                ],
                ["VTU", "Airtime and data on major Nigerian networks"],
                ["Virtual numbers", "SMS numbers for verification flows"],
                ["Cards & eSIM", "Digital cards and travel connectivity"],
              ].map(([name, detail]) => (
                <li
                  key={name}
                  className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-8"
                >
                  <span className="text-[14px] font-medium text-moon">{name}</span>
                  <span className="text-[13px] text-mist sm:text-right max-w-md">
                    {detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Money flow */}
        <section className="border-t border-white/[0.06] px-5 sm:px-8 py-14 sm:py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[13px] font-medium text-mist mb-8">
              How money moves
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                [
                  "Fund",
                  "Top up with Paystack or USDT. Credit hits the ledger in kobo.",
                ],
                [
                  "Order",
                  "Pick a service. We hold the full amount the moment you confirm.",
                ],
                [
                  "Settle",
                  "When delivery lands, the hold becomes a charge. Failures release.",
                ],
              ].map(([title, body]) => (
                <div key={title} className="surface p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    <h3 className="text-[14px] font-medium text-moon">{title}</h3>
                  </div>
                  <p className="text-[13px] text-mist leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Close */}
        <section className="border-t border-white/[0.06] px-5 sm:px-8 py-16 sm:py-20">
          <div className="max-w-xl">
            <GalagoMark className="w-10 h-10 mb-5" />
            <h2 className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-moon">
              Small. Sharp. Awake at night.
            </h2>
            <p className="mt-3 text-[14px] text-mist leading-relaxed">
              Galago is the bushbaby — Africa&apos;s nocturnal climber with
              enormous eyes. Not an owl. The wallet that works while you rest.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex mt-8 bg-gold text-night text-[13px] font-semibold px-6 py-2.5 rounded-full hover:brightness-110 transition"
            >
              Open your wallet
            </Link>
          </div>
        </section>

        <footer className="border-t border-white/[0.06] px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px] text-mist">
          <div className="flex items-center gap-2">
            <GalagoMark className="w-5 h-5" />
            <span>© {new Date().getFullYear()} Galago</span>
          </div>
          <span>galago.ng</span>
        </footer>
      </div>
    </main>
  );
}
