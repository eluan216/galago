import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-bush/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-night font-bold text-sm">
            G
          </div>
          <span className="text-xl font-semibold tracking-tight">galago</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/services" className="text-mist hover:text-moon transition">
            Services
          </Link>
          <Link href="/auth/signin" className="text-mist hover:text-moon transition">
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="bg-gold text-night px-4 py-2 rounded-lg font-medium hover:bg-gold-glow transition"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-gold text-sm font-medium tracking-widest uppercase mb-4">
          Nigerian · Nocturnal · Sharp
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl text-balance">
          Grow while you sleep
        </h1>
        <p className="mt-6 text-lg text-mist max-w-xl text-balance">
          One Naira wallet for real social engagement, airtime, virtual numbers,
          cards, eSIM — and fund it with crypto.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="bg-gold text-night px-8 py-3 rounded-xl font-semibold hover:bg-gold-glow transition"
          >
            Start free
          </Link>
          <Link
            href="/services"
            className="border border-mist/30 text-moon px-8 py-3 rounded-xl font-medium hover:border-gold/50 transition"
          >
            Browse services
          </Link>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-t border-bush px-6 py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-gold text-2xl mb-2">◎</div>
            <h3 className="font-semibold">Unified wallet</h3>
            <p className="text-mist text-sm mt-1">Fund once. Spend on everything.</p>
          </div>
          <div>
            <div className="text-gold text-2xl mb-2">₿</div>
            <h3 className="font-semibold">Crypto funding</h3>
            <p className="text-mist text-sm mt-1">USDT and more. Instant credit.</p>
          </div>
          <div>
            <div className="text-gold text-2xl mb-2">☾</div>
            <h3 className="font-semibold">Works at night</h3>
            <p className="text-mist text-sm mt-1">Orders deliver while you sleep.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-bush px-6 py-6 text-center text-mist text-sm">
        © {new Date().getFullYear()} Galago · galago.ng
      </footer>
    </main>
  );
}