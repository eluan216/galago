import Link from "next/link";
import { GalagoMark, GalagoWordmark } from "@/components/logo";

/**
 * Galago marketing landing
 * Restraint Design + stronger craft:
 * - Custom bushbaby mark (large eyes, gold iris)
 * - Hero hierarchy by type, not color noise
 * - One gold for primary action only
 * - Inset surfaces, quiet chrome
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient night glow — subtle, not a gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(232,185,35,0.07), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(45,212,168,0.03), transparent 50%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] px-5 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <GalagoWordmark />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-[13px]">
          <Link
            href="/auth/signin"
            className="text-mist hover:text-moon px-3 py-1.5 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="bg-moon text-night px-3.5 py-1.5 rounded-full font-medium hover:bg-white transition-colors"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-5 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <GalagoMark className="w-16 h-16 sm:w-20 sm:h-20" />
            <div
              aria-hidden
              className="absolute inset-0 rounded-full blur-2xl -z-10 opacity-40"
              style={{ background: "rgba(232,185,35,0.25)" }}
            />
          </div>
        </div>

        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-mist mb-5">
          Nigeria · Night shift marketplace
        </p>

        <h1 className="text-[2.35rem] sm:text-5xl md:text-[3.25rem] font-semibold tracking-[-0.03em] leading-[1.08] max-w-[14ch] text-moon text-balance">
          Grow while you sleep
        </h1>

        <p className="mt-5 text-[15px] sm:text-base leading-relaxed text-mist max-w-md text-balance">
          One Naira wallet for real engagement, airtime, virtual numbers, and
          cards. Fund with Paystack or USDT. Orders keep moving after you close
          the laptop.
        </p>

        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link
            href="/auth/signup"
            className="bg-gold text-night px-7 py-2.5 rounded-full text-[13px] font-semibold hover:brightness-110 transition shadow-[0_0_0_1px_rgba(232,185,35,0.3)]"
          >
            Start free
          </Link>
          <Link
            href="/auth/signin"
            className="border border-white/[0.1] text-moon px-7 py-2.5 rounded-full text-[13px] font-medium hover:border-white/25 transition"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-8 text-[12px] text-mist/80">
          Hold-until-delivered · Crypto + Naira · Built for resellers
        </p>
      </section>

      {/* Pillars */}
      <section className="relative border-t border-white/[0.06] px-5 sm:px-8 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-mist text-center mb-10">
            Why Galago
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                kicker: "Wallet",
                title: "Fund once",
                body: "Naira via Paystack or USDT on TRC20. One balance across every service.",
              },
              {
                kicker: "Trust",
                title: "Hold until real",
                body: "We reserve funds when you order. Settle only when delivery lands.",
              },
              {
                kicker: "Night",
                title: "Works while you sleep",
                body: "Bushbaby energy: small, sharp, nocturnal. Campaigns keep running after midnight.",
              },
            ].map((item) => (
              <div
                key={item.kicker}
                className="bg-surface border border-white/[0.06] rounded-card p-5 sm:p-6 text-left"
              >
                <p className="text-gold text-[11px] font-medium tracking-wide">
                  {item.kicker}
                </p>
                <h3 className="text-[15px] font-medium text-moon mt-2">
                  {item.title}
                </h3>
                <p className="text-mist text-[13px] mt-2 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="relative border-t border-white/[0.06] px-5 sm:px-8 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-mist mb-3">
              Catalog
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-moon">
              What you can run tonight
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Social",
                "Followers, likes, views — real delivery tiers"],
              ["VTU",
                "Airtime & data for major Nigerian networks"],
              ["Numbers",
                "Virtual SMS numbers for verification"],
              ["Cards & eSIM",
                "Digital cards and travel connectivity"],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="bg-surface border border-white/[0.06] rounded-card p-4 sm:p-5"
              >
                <h3 className="text-[13px] font-medium text-moon">{title}</h3>
                <p className="text-mist text-[12px] mt-1.5 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative border-t border-white/[0.06] px-5 sm:px-8 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-mist text-center mb-10">
            Flow
          </p>
          <ol className="space-y-0">
            {[
              ["01", "Create account", "Sign up in under a minute. Wallet opens at zero."],
              ["02", "Fund wallet", "Paystack (Naira) or USDT. Instant ledger entry."],
              ["03", "Place order", "Pick a service. We hold the exact amount."],
              ["04", "Delivery settles", "When it lands, the hold becomes a charge."],
            ].map(([n, title, body], i) => (
              <li
                key={n}
                className={`flex gap-4 sm:gap-6 py-5 ${
                  i < 3 ? "border-b border-white/[0.06]" : ""
                }`}
              >
                <span className="text-gold text-[13px] font-medium tabular-nums w-6 shrink-0 pt-0.5">
                  {n}
                </span>
                <div>
                  <h3 className="text-[15px] font-medium text-moon">{title}</h3>
                  <p className="text-mist text-[13px] mt-1">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative border-t border-white/[0.06] px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-lg mx-auto text-center">
          <GalagoMark className="w-12 h-12 mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-moon text-balance">
            Small. Sharp. Awake at night.
          </h2>
          <p className="mt-3 text-mist text-[14px] leading-relaxed">
            Galago is the bushbaby — Africa&apos;s nocturnal climber with enormous
            eyes. Not an owl. Built to work while you rest.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block mt-8 bg-gold text-night px-8 py-2.5 rounded-full text-[13px] font-semibold hover:brightness-110 transition"
          >
            Open your wallet
          </Link>
        </div>
      </section>

      <footer className="relative border-t border-white/[0.06] px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-mist">
        <div className="flex items-center gap-2">
          <GalagoMark className="w-5 h-5" />
          <span>© {new Date().getFullYear()} Galago</span>
        </div>
        <span className="opacity-70">galago.ng · Port Harcourt roots</span>
      </footer>
    </main>
  );
}
