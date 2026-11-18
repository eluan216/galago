import Link from "next/link";
import { GalagoMark, GalagoWordmark } from "@/components/logo";
import { HoldDemo } from "@/components/HoldDemo";

/**
 * Galago landing v3
 * Electric blue + lime, bold Outfit, consistent bushbaby mark,
 * marquee ribbons, interactive hold demo.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bl)] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-20 py-3.5 px-0">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="glass-nav flex items-center gap-5 sm:gap-7 rounded-full py-1.5 pl-2.5 pr-2">
            <Link href="/" className="shrink-0">
              <GalagoWordmark />
            </Link>
            <div className="hidden sm:flex gap-6 flex-1 ml-2 text-[12px] font-bold tracking-[0.06em] uppercase">
              <a href="#services" className="opacity-85 hover:opacity-100 hover:text-[var(--li)]">
                Services
              </a>
              <a href="#how" className="opacity-85 hover:opacity-100 hover:text-[var(--li)]">
                How it works
              </a>
              <a href="#about" className="opacity-85 hover:opacity-100 hover:text-[var(--li)]">
                About
              </a>
            </div>
            <Link
              href="/auth/signin"
              className="hidden sm:inline text-[12px] font-bold tracking-[0.06em] uppercase opacity-90 hover:opacity-100"
            >
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-galago btn-galago-sm">
              Open wallet
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative pt-8 pb-0 overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6 relative">
          <div className="absolute right-[2%] -top-1 z-[3] bg-[var(--li)] text-[var(--ink)] font-black uppercase leading-none tracking-tight text-[clamp(18px,2.6vw,34px)] px-5 py-4 rounded-[26px] outline outline-2 outline-dashed outline-[var(--ink)] outline-offset-[-8px] rotate-[3deg] text-center pointer-events-none">
            Naira +
            <br />
            USDT
          </div>

          <div className="absolute right-[4%] top-[4%] w-[min(42vw,380px)] aspect-square z-[2] pointer-events-none animate-bob hidden md:block">
            <GalagoMark className="w-full h-full" />
          </div>

          <h1 className="relative z-[1] font-black uppercase tracking-[-0.035em] leading-[0.98] text-[clamp(44px,9vw,120px)] max-w-[14ch] [text-shadow:0_8px_24px_rgba(10,5,90,0.45)]">
            Partners in the work that runs after dark.
          </h1>

          <p className="relative z-[3] max-w-[430px] text-[17px] mt-8 mb-6 text-[#e7e5ff]">
            Galago is the wallet for real engagement, airtime, virtual numbers
            and cards. We hold your money until delivery lands, then settle.
          </p>

          <div className="relative z-[3] flex flex-wrap gap-3.5 pb-28">
            <Link href="/auth/signup" className="btn-galago">
              Open your wallet
            </Link>
            <a href="#services" className="btn-galago btn-galago-outline">
              Explore services
            </a>
          </div>
        </div>

        {/* Marquee ribbons */}
        <div className="absolute left-[-4%] right-[-4%] bottom-8 z-[4] pointer-events-none" aria-hidden>
          <div className="absolute inset-x-0 -bottom-3.5 bg-[var(--li2)] py-3.5 rotate-[1.3deg] -z-10 overflow-hidden">
            <div className="inline-flex whitespace-nowrap animate-marquee-rev">
              {Array.from({ length: 2 }).map((_, i) => (
                <span key={i} className="inline-flex">
                  {["Hold until delivered", "Kobo precision", "Failures release funds"].map(
                    (t) => (
                      <span
                        key={t + i}
                        className="font-extrabold text-[clamp(17px,2.2vw,26px)] uppercase tracking-tight px-5 border-r-2 border-[rgba(15,11,59,0.4)] text-[var(--ink)]"
                      >
                        {t}
                      </span>
                    )
                  )}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-[var(--li)] text-[var(--ink)] overflow-hidden whitespace-nowrap py-[18px] -rotate-[2.2deg] shadow-[0_14px_30px_rgba(10,5,90,0.35)]">
            <div className="inline-flex animate-marquee">
              {Array.from({ length: 2 }).map((_, i) => (
                <span key={i} className="inline-flex">
                  {[
                    "Social growth",
                    "Airtime & data",
                    "Virtual numbers",
                    "Cards & eSIM",
                    "Naira + USDT",
                  ].map((t) => (
                    <span
                      key={t + i}
                      className="font-extrabold text-[clamp(17px,2.2vw,26px)] uppercase tracking-tight px-5 border-r-2 border-[rgba(15,11,59,0.4)]"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Services */}
      <section id="services" className="bg-[var(--of)] text-[var(--ink)] py-[110px] relative z-[1]">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="flex flex-wrap justify-between gap-8 items-end mb-12">
            <h2 className="font-black uppercase tracking-tight text-[clamp(34px,5.4vw,68px)] max-w-[900px] leading-[0.98]">
              Services that keep{" "}
              <span className="inline-block bg-[var(--bl)] text-white rounded-full px-[0.32em] py-[0.02em] outline outline-2 outline-dashed outline-[var(--li)] outline-offset-[-5px]">
                moving
              </span>{" "}
              after midnight.
            </h2>
            <p className="text-[var(--mu)] max-w-[430px] m-0">
              Every service draws from the same ledger and follows the same hold
              logic.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                lime: true,
                title: (
                  <>
                    Real
                    <br />
                    engagement
                  </>
                ),
                body: "Followers, likes and views in tiered quality, at reseller rates.",
                panel: (
                  <>
                    <div className="flex justify-between bg-white/14 rounded-lg px-2.5 py-1.5">
                      <span>IG · 1k followers</span>
                      <span>₦3,200</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/22 overflow-hidden">
                      <i className="block h-full w-[70%] bg-[var(--li)] rounded-full" />
                    </div>
                    <b className="text-[11px] tracking-[0.08em] uppercase text-center mt-auto opacity-90">
                      Held until delivery confirms
                    </b>
                  </>
                ),
              },
              {
                lime: false,
                title: (
                  <>
                    Airtime
                    <br />
                    &amp; data
                  </>
                ),
                body: "Top up the major Nigerian networks from the same wallet.",
                panel: (
                  <>
                    <div className="flex justify-between bg-white/14 rounded-lg px-2.5 py-1.5">
                      <span>2GB data</span>
                      <span>₦1,150</span>
                    </div>
                    <div className="flex justify-between bg-white/14 rounded-lg px-2.5 py-1.5">
                      <span>Airtime</span>
                      <span>₦1,000</span>
                    </div>
                    <b className="text-[11px] tracking-[0.08em] uppercase text-center mt-auto opacity-90">
                      Instant, network-native
                    </b>
                  </>
                ),
              },
              {
                lime: false,
                title: (
                  <>
                    Virtual
                    <br />
                    numbers
                  </>
                ),
                body: "Rent numbers for verification flows.",
                panel: (
                  <>
                    <div className="font-extrabold text-[26px] tracking-[0.2em] text-center text-[var(--li)]">
                      4 8 2 9 1 7
                    </div>
                    <b className="text-[11px] tracking-[0.08em] uppercase text-center mt-auto opacity-90">
                      Same hold logic, same ledger
                    </b>
                  </>
                ),
              },
              {
                lime: false,
                title: (
                  <>
                    Cards
                    <br />
                    &amp; eSIM
                  </>
                ),
                body: "Digital cards and travel eSIMs, no leaving the balance.",
                panel: (
                  <>
                    <div className="bg-gradient-to-br from-white to-[#cfd0ff] rounded-[10px] p-2.5 text-[var(--ink)] font-extrabold h-[62px] flex flex-col justify-between">
                      <span>Galago card</span>
                      <span>•••• 0000</span>
                    </div>
                    <b className="text-[11px] tracking-[0.08em] uppercase text-center mt-auto opacity-90">
                      One wallet, global reach
                    </b>
                  </>
                ),
              },
            ].map((c, i) => (
              <article
                key={i}
                className={`rounded-[22px] px-[22px] pt-[26px] pb-[22px] flex flex-col items-center text-center gap-2 shadow-[0_10px_30px_rgba(42,27,247,0.08)] transition-transform hover:-translate-y-1.5 ${
                  c.lime ? "bg-[var(--li)]" : "bg-white"
                }`}
              >
                <h3 className="text-2xl font-black uppercase leading-none">
                  {c.title}
                </h3>
                <p
                  className={`m-0 text-sm min-h-[44px] ${
                    c.lime ? "text-[#2b3300]" : "text-[var(--mu)]"
                  }`}
                >
                  {c.body}
                </p>
                <div className="mt-3 w-full bg-[var(--bl)] rounded-2xl p-3.5 text-white shadow-[0_8px_0_var(--bl2)] text-left text-[13px] min-h-[130px] flex flex-col gap-2">
                  {c.panel}
                </div>
              </article>
            ))}
          </div>

          <div className="pt-[70px] pb-8 text-center font-bold tracking-[0.06em] uppercase text-[13px]">
            Fund your wallet with
            <div className="flex gap-11 justify-center flex-wrap mt-4 text-[22px] tracking-tight normal-case font-extrabold">
              <span>Paystack</span>
              <span>USDT TRC20</span>
            </div>
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-[110px] bg-[var(--bl)] text-white">
        <div className="max-w-[1180px] mx-auto px-6">
          <p className="font-black uppercase tracking-tight leading-[1.02] text-[clamp(28px,4.6vw,58px)] max-w-[1000px]">
            We hold your money until delivery lands{" "}
            <span className="inline-grid place-items-center w-[0.9em] h-[0.9em] rounded-full bg-[var(--li)] text-[var(--ink)] align-[-0.1em] text-[0.8em] mx-[0.1em]">
              ✱
            </span>{" "}
            then settle. If it fails, funds release.
          </p>
          <HoldDemo />
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-[var(--of)] text-[var(--ink)] py-[110px]">
        <div className="max-w-[1180px] mx-auto px-6 grid grid-cols-1 md:grid-cols-[0.75fr_1.25fr] gap-10 items-center">
          <div className="mx-auto w-full max-w-[320px]">
            <GalagoMark className="w-full h-auto" />
          </div>
          <div>
            <h2 className="font-black uppercase tracking-tight text-[clamp(34px,5vw,56px)] leading-[0.98]">
              Small. Sharp. Awake at night.
            </h2>
            <p className="text-[var(--mu)] text-[19px] max-w-[520px] mt-4 mb-7">
              Galago is the bushbaby, Africa&apos;s nocturnal climber with
              enormous eyes. Not an owl. The wallet that works while you rest.
            </p>
            <Link
              href="/auth/signup"
              className="btn-galago"
              style={{
                background: "var(--bl)",
                color: "#fff",
                borderColor: "var(--ink)",
              }}
            >
              Open your wallet
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--li)] text-[var(--ink)] py-[100px] text-center">
        <div className="max-w-[1180px] mx-auto px-6">
          <h2 className="font-black uppercase tracking-tight text-[clamp(34px,5vw,56px)] leading-[0.98] mx-auto mb-4">
            One ledger. Kobo precision.
          </h2>
          <p className="max-w-[520px] mx-auto mb-8 font-medium text-[19px]">
            Settle only when it lands. Failures release funds. That is the
            contract.
          </p>
          <Link
            href="/auth/signup"
            className="btn-galago"
            style={{
              background: "var(--ink)",
              color: "var(--li)",
              boxShadow: "0 5px 0 #000",
              borderColor: "#000",
            }}
          >
            Start free
          </Link>
        </div>
      </section>

      <footer className="bg-[var(--ink)] text-[#bfbbe8] py-8 text-sm">
        <div className="max-w-[1180px] mx-auto px-6 flex flex-wrap justify-between gap-3">
          <span>© {new Date().getFullYear()} Galago</span>
          <span>galago.ng, Port Harcourt roots</span>
        </div>
      </footer>
    </main>
  );
}
