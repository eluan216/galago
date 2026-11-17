import Link from "next/link";
import { GalagoMark, GalagoWordmark } from "@/components/logo";

/**
 * Galago landing — Afternow craft, Galago product
 * Borrowed: oversized type, airy sections, case-study cards, tag pills, contrast band
 * Kept: nocturnal field, gold accent, hold-until-delivered, wallet product truth
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-night-field text-moon">
      {/* Nav — minimal, sticky, Afternow-clean */}
      <header className="sticky top-0 z-30 border-b border-white/[0.05] bg-night/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <GalagoWordmark />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 text-[13px]">
            <Link
              href="#services"
              className="hidden sm:inline text-mist hover:text-moon px-3 py-1.5 transition-colors"
            >
              Services
            </Link>
            <Link
              href="#how"
              className="hidden sm:inline text-mist hover:text-moon px-3 py-1.5 transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/auth/signin"
              className="text-mist hover:text-moon px-3 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="ml-1 bg-moon text-night px-4 py-1.5 rounded-full font-medium hover:bg-white transition-colors"
            >
              Open wallet
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — huge type + floating product object */}
      <section className="px-5 sm:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-[13px] text-mist mb-6">
              Nigeria · Night-shift marketplace
            </p>
            <h1 className="text-[2.75rem] sm:text-5xl md:text-[3.75rem] font-semibold tracking-[-0.04em] leading-[1.02] text-moon text-balance">
              Partners in the work that runs after dark.
            </h1>
            <p className="mt-6 text-[16px] sm:text-[17px] leading-relaxed text-mist max-w-xl">
              Galago is the Naira + USDT wallet for real engagement, airtime,
              virtual numbers, and cards. We hold your money until delivery
              lands — then settle. Built for resellers who work while others
              sleep.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center bg-gold text-night text-[14px] font-semibold px-7 py-3 rounded-full hover:brightness-110 transition"
              >
                Open your wallet
              </Link>
              <Link
                href="#services"
                className="text-[14px] text-mist hover:text-moon transition-colors"
              >
                Explore services →
              </Link>
            </div>
          </div>

          {/* Floating product panel — like Afternow's hero media object */}
          <div className="mt-16 sm:mt-20 max-w-2xl">
            <div className="surface overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <GalagoMark className="w-6 h-6" />
                  <span className="text-[13px] font-medium">Wallet</span>
                </div>
                <span className="text-[11px] text-mist tracking-wide">
                  Live ledger · kobo
                </span>
              </div>
              <div className="px-5 sm:px-6 pt-7 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <p className="text-[12px] text-mist">Available</p>
                  <p className="mt-1 text-[2rem] font-semibold tracking-tight tabular-nums">
                    ₦48,250
                  </p>
                  <p className="mt-1 text-[12px] text-mist">
                    ₦6,400 in active holds
                  </p>
                  <div className="mt-5 flex gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.1] text-mist">
                      Paystack
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.1] text-mist">
                      USDT TRC20
                    </span>
                  </div>
                </div>
                <div className="space-y-3 border-t sm:border-t-0 sm:border-l border-white/[0.06] pt-5 sm:pt-0 sm:pl-8">
                  {[
                    ["Hold", "IG · 1k followers", "−₦3,200"],
                    ["Fund", "Paystack", "+₦20,000"],
                    ["Settle", "MTN 2GB", "−₦1,150"],
                  ].map(([t, l, a]) => (
                    <div
                      key={l}
                      className="flex items-center justify-between text-[13px] gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-mist text-[11px] block">{t}</span>
                        <span className="text-moon truncate block">{l}</span>
                      </div>
                      <span
                        className={`tabular-nums shrink-0 ${
                          a.startsWith("+") ? "text-success" : "text-moon"
                        }`}
                      >
                        {a}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* High-contrast band — Afternow chartreuse energy → Galago gold */}
      <section className="bg-gold text-night">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-12">
          <p className="text-[1.35rem] sm:text-2xl font-semibold tracking-tight leading-snug max-w-2xl">
            Hold until delivered. Settle only when it lands. Failures release
            funds. That is the contract.
          </p>
          <p className="mt-3 text-[14px] opacity-80 max-w-lg">
            One ledger. Kobo precision. Built for Nigerian resellers who cannot
            afford fuzzy balances.
          </p>
        </div>
      </section>

      {/* Services as case-study cards */}
      <section id="services" className="px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 sm:mb-16 max-w-2xl">
            <p className="text-[13px] text-mist mb-3">What runs on Galago</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] leading-tight text-moon">
              Services that keep moving after midnight.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                tags: ["Social", "Delivery"],
                title: "Real engagement",
                body: "Followers, likes, views — tiered quality. Funds held until delivery confirms.",
                outcome: "Hold-until-delivered · Reseller rates",
              },
              {
                tags: ["VTU", "Nigeria"],
                title: "Airtime & data",
                body: "Top-up major Nigerian networks from the same wallet you use for social.",
                outcome: "Instant · Network-native",
              },
              {
                tags: ["Numbers", "SMS"],
                title: "Virtual numbers",
                body: "Rent numbers for verification flows. Same hold logic, same ledger.",
                outcome: "Verification-ready",
              },
              {
                tags: ["Cards", "eSIM"],
                title: "Cards & connectivity",
                body: "Digital cards and travel eSIMs without leaving the Galago balance.",
                outcome: "One wallet · Global reach",
              },
            ].map((item) => (
              <article key={item.title} className="case-card p-6 sm:p-8 flex flex-col">
                <div className="flex flex-wrap gap-2 mb-5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.1] text-mist"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-moon">
                  {item.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-mist flex-1">
                  {item.body}
                </p>
                <p className="mt-6 text-[12px] text-gold">{item.outcome}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — editorial, not numbered chrome */}
      <section id="how" className="border-t border-white/[0.06] px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="text-[13px] text-mist mb-3">How money moves</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] leading-tight text-moon">
              Fund. Order. Settle.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-mist max-w-sm">
              Three steps. No mystery fees. The ledger is the source of truth —
              every kobo accounted for.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex mt-8 bg-gold text-night text-[13px] font-semibold px-6 py-2.5 rounded-full hover:brightness-110 transition"
            >
              Start free
            </Link>
          </div>
          <div className="lg:col-span-7 space-y-0">
            {[
              {
                title: "Fund",
                body: "Paystack for Naira or USDT on TRC20. Credit hits your ledger immediately.",
              },
              {
                title: "Order",
                body: "Pick a service and quantity. We reserve the exact amount — a hold, not a charge.",
              },
              {
                title: "Settle",
                body: "When delivery confirms, the hold becomes a charge. If it fails, funds release.",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className={`py-7 ${
                  i < 2 ? "border-b border-white/[0.06]" : ""
                }`}
              >
                <h3 className="text-[17px] font-medium text-moon">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-mist max-w-md">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing — spacious, confident */}
      <section className="border-t border-white/[0.06] px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <GalagoMark className="w-12 h-12 mb-8" />
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.035em] leading-[1.05] text-moon max-w-2xl text-balance">
            Small. Sharp. Awake at night.
          </h2>
          <p className="mt-5 text-[15px] text-mist max-w-lg leading-relaxed">
            Galago is the bushbaby — Africa&apos;s nocturnal climber with
            enormous eyes. Not an owl. The wallet that works while you rest.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex mt-10 bg-gold text-night text-[14px] font-semibold px-7 py-3 rounded-full hover:brightness-110 transition"
          >
            Open your wallet
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-5 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] text-mist">
          <div className="flex items-center gap-2">
            <GalagoMark className="w-5 h-5" />
            <span>© {new Date().getFullYear()} Galago</span>
          </div>
          <span>galago.ng · Port Harcourt roots</span>
        </div>
      </footer>
    </main>
  );
}
