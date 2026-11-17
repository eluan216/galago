import Link from "next/link";
import { GalagoMark, GalagoWordmark } from "@/components/logo";

/**
 * Galago landing — de-slopped
 * Direction: nocturnal restraint
 * Layout: monument hero (not dual-CTA SaaS)
 * Signature: bushbaby mark + hold-until-delivered
 * Banned: three equal feature cards, decorative 01/02/03, dual hero CTAs
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-night text-moon">
      <header className="border-b border-white/[0.06] px-5 sm:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <GalagoWordmark />
        </Link>
        <nav className="flex items-center gap-3 text-[13px]">
          <Link href="/auth/signin" className="text-mist hover:text-moon transition-colors">
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

      {/* Monument hero — one mark, one line, one CTA */}
      <section className="px-5 sm:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28">
        <div className="max-w-2xl">
          <GalagoMark className="w-14 h-14 sm:w-16 sm:h-16 mb-8" />

          <h1 className="text-[2.5rem] sm:text-[3.25rem] font-semibold tracking-[-0.035em] leading-[1.05] text-moon">
            Grow while you sleep
          </h1>

          <p className="mt-5 text-[15px] sm:text-[16px] leading-relaxed text-mist max-w-lg">
            Naira wallet for real social delivery, airtime, virtual numbers, and
            cards. Fund with Paystack or USDT. We hold your money until the order
            actually lands.
          </p>

          <div className="mt-9">
            <Link
              href="/auth/signup"
              className="inline-flex items-center bg-gold text-night text-[13px] font-semibold px-6 py-2.5 rounded-full hover:brightness-110 transition"
            >
              Open your wallet
            </Link>
          </div>

          <p className="mt-6 text-[12px] text-mist">
            Built for Nigerian resellers · Port Harcourt roots
          </p>
        </div>
      </section>

      {/* Product truth — uneven, not three equal cards */}
      <section className="border-t border-white/[0.06] px-5 sm:px-8 py-14 sm:py-16">
        <div className="max-w-3xl grid grid-cols-1 sm:grid-cols-12 gap-6">
          <div className="sm:col-span-7 bg-surface border border-white/[0.06] rounded-card p-6 sm:p-7">
            <h2 className="text-[17px] font-medium text-moon tracking-tight">
              Hold until delivered
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-mist">
              When you place an order, the exact amount is reserved on your
              ledger. Nothing settles until delivery confirms. If it fails, the
              hold releases. That is the contract — not a marketing line.
            </p>
          </div>
          <div className="sm:col-span-5 flex flex-col gap-6">
            <div className="bg-surface border border-white/[0.06] rounded-card p-5">
              <h3 className="text-[14px] font-medium text-moon">One balance</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mist">
                Paystack (Naira) or USDT-TRC20. Same wallet for every service.
              </p>
            </div>
            <div className="bg-surface border border-white/[0.06] rounded-card p-5">
              <h3 className="text-[14px] font-medium text-moon">Night ops</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mist">
                Campaigns keep running after you close the laptop. Bushbaby
                hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog — dense list, not icon-card grid */}
      <section className="border-t border-white/[0.06] px-5 sm:px-8 py-14 sm:py-16">
        <div className="max-w-3xl">
          <h2 className="text-[13px] font-medium text-mist mb-6">What runs on Galago</h2>
          <ul className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {[
              ["Social delivery", "Followers, likes, views — tiered quality, held until real"],
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

      {/* How money moves — sequence without decorative numbering chrome */}
      <section className="border-t border-white/[0.06] px-5 sm:px-8 py-14 sm:py-16">
        <div className="max-w-3xl">
          <h2 className="text-[13px] font-medium text-mist mb-8">How money moves</h2>
          <div className="space-y-8">
            {[
              [
                "Fund",
                "Top up with Paystack or USDT. Credit hits the ledger in kobo.",
              ],
              [
                "Order",
                "Pick a service and quantity. We hold the full amount immediately.",
              ],
              [
                "Settle",
                "When delivery lands, the hold becomes a charge. Failures release funds.",
              ],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-5">
                <div className="w-px bg-white/[0.08] relative">
                  <span className="absolute top-1.5 -left-[3px] w-1.5 h-1.5 rounded-full bg-gold" />
                </div>
                <div className="pb-1">
                  <h3 className="text-[14px] font-medium text-moon">{title}</h3>
                  <p className="mt-1 text-[13px] text-mist leading-relaxed max-w-md">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="border-t border-white/[0.06] px-5 sm:px-8 py-16 sm:py-20">
        <div className="max-w-xl">
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
    </main>
  );
}
