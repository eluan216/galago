import Link from "next/link";

/**
 * Marketing landing — Taste DNA redesign
 * Restraint: near-black, one gold accent, hierarchy by type weight.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-white/[0.06] px-5 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center text-night font-semibold text-xs tracking-tight">
            G
          </div>
          <span className="text-[15px] font-medium tracking-tight text-moon">
            galago
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3 text-[13px]">
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

      <section className="flex-1 flex flex-col items-center justify-center px-5 py-24 sm:py-32 text-center">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-mist mb-6">
          Nigerian · Nocturnal · Sharp
        </p>
        <h1 className="text-display sm:text-5xl max-w-[18ch] text-balance text-moon">
          Grow while you sleep
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-mist max-w-md text-balance">
          One Naira wallet for real social engagement, airtime, numbers, and
          cards. Fund with Paystack or USDT.
        </p>
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link
            href="/auth/signup"
            className="bg-gold text-night px-6 py-2.5 rounded-full text-[13px] font-semibold hover:brightness-110 transition"
          >
            Start free
          </Link>
          <Link
            href="/auth/signin"
            className="border border-white/[0.08] text-moon px-6 py-2.5 rounded-full text-[13px] font-medium hover:border-white/20 transition"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-5 sm:px-8 py-16">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-left sm:text-center">
          <div>
            <p className="text-gold text-xs font-medium tracking-wide mb-2">Wallet</p>
            <h3 className="text-[15px] font-medium text-moon">Fund once</h3>
            <p className="text-mist text-[13px] mt-1.5 leading-relaxed">
              Naira or USDT. Spend across every service.
            </p>
          </div>
          <div>
            <p className="text-gold text-xs font-medium tracking-wide mb-2">Delivery</p>
            <h3 className="text-[15px] font-medium text-moon">Hold until real</h3>
            <p className="text-mist text-[13px] mt-1.5 leading-relaxed">
              Funds reserved, settled only when it lands.
            </p>
          </div>
          <div>
            <p className="text-gold text-xs font-medium tracking-wide mb-2">Night</p>
            <h3 className="text-[15px] font-medium text-moon">Works while you sleep</h3>
            <p className="text-mist text-[13px] mt-1.5 leading-relaxed">
              Orders keep moving after you close the laptop.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-5 py-8 text-center text-mist text-[12px]">
        © {new Date().getFullYear()} Galago · galago.ng
      </footer>
    </main>
  );
}
