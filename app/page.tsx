import Link from "next/link";
import { GalagoMark, GalagoWordmark } from "@/components/logo";
import { HoldDemo } from "@/components/HoldDemo";
import { GalagoChat } from "@/components/GalagoChat";

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
              <a href="#faq" className="opacity-85 hover:opacity-100 hover:text-[var(--li)]">
                FAQ
              </a>
            </div>
            <Link
              href="/auth/signin"
              className="text-[12px] font-bold tracking-[0.06em] uppercase opacity-90 hover:opacity-100"
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
          <div className="hidden sm:block absolute right-[2%] -top-1 z-[3] bg-[var(--li)] text-[var(--ink)] font-black uppercase leading-none tracking-tight text-[clamp(18px,2.6vw,34px)] px-5 py-4 rounded-[26px] outline outline-2 outline-dashed outline-[var(--ink)] outline-offset-[-8px] rotate-[3deg] text-center pointer-events-none">
            Naira +
            <br />
            USDT
          </div>

          <div className="absolute right-[4%] top-[4%] w-[min(42vw,380px)] aspect-square z-[2] pointer-events-none animate-bob hidden md:block">
            <GalagoMark className="w-full h-full" />
          </div>

          <h1 className="relative z-[1] font-black uppercase tracking-[-0.035em] leading-[0.98] text-[clamp(44px,9vw,120px)] max-w-[14ch] [text-shadow:0_8px_24px_rgba(10,5,90,0.45)]">
            Your digital services. One wallet.
          </h1>

          <p className="relative z-[3] max-w-[430px] text-[17px] mt-8 mb-6 text-[#e7e5ff]">
            Explore supported digital services, Nigerian bill payments and
            eSIM plans in one account. Fund your wallet when you&apos;re ready,
            place an order, and track its status from your dashboard.
          </p>

          <div className="relative z-[3] flex flex-wrap gap-3.5 pb-28">
            <Link href="/auth/signup" className="btn-galago">
              Get started
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
                  {["Wallet control", "Order tracking", "Provider-aware status"].map(
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
                    "Bill payments",
                    "Airtime & data",
                    "eSIM plans",
                    "Order tracking",
                    "Paystack + USDT where available",
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

      {/* Trust */}
      <section className="bg-white text-[var(--ink)] py-8 relative z-[1]" aria-label="What to expect from Galago">
        <div className="max-w-[1180px] mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Wallet control",
              body: "Your balance stays available until you choose to place an order.",
            },
            {
              title: "Order visibility",
              body: "Review transaction and order status from your account.",
            },
            {
              title: "Provider-led delivery",
              body: "Timing and fulfilment depend on the selected service.",
            },
            {
              title: "Payment choice",
              body: "See the funding options currently available to you in your wallet.",
            },
          ].map((item) => (
            <article key={item.title} className="border-l-4 border-[var(--li)] pl-4">
              <h2 className="font-black uppercase tracking-tight">{item.title}</h2>
              <p className="m-0 mt-1 text-sm text-[var(--mu)]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-[var(--of)] text-[var(--ink)] py-[110px] relative z-[1]">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="flex flex-wrap justify-between gap-8 items-end mb-12">
            <h2 className="font-black uppercase tracking-tight text-[clamp(34px,5.4vw,68px)] max-w-[900px] leading-[0.98]">
              Digital services,{" "}
              <span className="inline-block bg-[var(--bl)] text-white rounded-full px-[0.32em] py-[0.02em] outline outline-2 outline-dashed outline-[var(--li)] outline-offset-[-5px]">
                one place
              </span>
            </h2>
            <p className="text-[var(--mu)] max-w-[430px] m-0">
              Explore services in your Galago account. Availability and
              delivery times can vary by provider and product.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                lime: true,
                title: (
                  <>
                    Airtime
                    <br />
                    &amp; data
                  </>
                ),
                body: "Top up supported Nigerian mobile networks.",
                panel: (
                  <>
                    <div className="flex justify-between bg-white/14 rounded-lg px-2.5 py-1.5">
                      <span>Mobile airtime</span>
                      <span>Top-up</span>
                    </div>
                    <div className="flex justify-between bg-white/14 rounded-lg px-2.5 py-1.5">
                      <span>Mobile data</span>
                      <span>Plans</span>
                    </div>
                    <b className="text-[11px] tracking-[0.08em] uppercase text-center mt-auto opacity-90">
                      Supported networks
                    </b>
                  </>
                ),
              },
              {
                lime: false,
                title: (
                  <>
                    Bill
                    <br />
                    payments
                  </>
                ),
                body: "Pay eligible electricity, TV, data and education services.",
                panel: (
                  <>
                    <div className="flex justify-between bg-white/14 rounded-lg px-2.5 py-1.5">
                      <span>Electricity</span>
                      <span>Verify</span>
                    </div>
                    <div className="flex justify-between bg-white/14 rounded-lg px-2.5 py-1.5">
                      <span>TV &amp; education</span>
                      <span>Pay</span>
                    </div>
                    <b className="text-[11px] tracking-[0.08em] uppercase text-center mt-auto opacity-90">
                      Eligible services
                    </b>
                  </>
                ),
              },
              {
                lime: false,
                title: (
                  <>
                    Travel
                    <br />
                    eSIMs
                  </>
                ),
                body: "Explore supported destinations and data plans.",
                panel: (
                  <>
                    <div className="flex justify-between bg-white/14 rounded-lg px-2.5 py-1.5">
                      <span>Destinations</span>
                      <span>Browse</span>
                    </div>
                    <div className="flex justify-between bg-white/14 rounded-lg px-2.5 py-1.5">
                      <span>Data plans</span>
                      <span>Compare</span>
                    </div>
                    <b className="text-[11px] tracking-[0.08em] uppercase text-center mt-auto opacity-90">
                      Purchase availability varies
                    </b>
                  </>
                ),
              },
              {
                lime: false,
                title: (
                  <>
                    Order
                    <br />
                    tracking
                  </>
                ),
                body: "Follow service requests and transaction updates in your account.",
                panel: (
                  <>
                    <div className="flex justify-between bg-white/14 rounded-lg px-2.5 py-1.5">
                      <span>Order status</span>
                      <span>Track</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/22 overflow-hidden">
                      <i className="block h-full w-[70%] bg-[var(--li)] rounded-full" />
                    </div>
                    <b className="text-[11px] tracking-[0.08em] uppercase text-center mt-auto opacity-90">
                      Provider updates
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
            Fund your wallet with supported options
            <div className="flex gap-11 justify-center flex-wrap mt-4 text-[22px] tracking-tight normal-case font-extrabold">
              <span>Paystack</span>
              <span>USDT · TRC20</span>
            </div>
            <p className="text-sm normal-case font-medium text-[var(--mu)] mt-3">
              Available payment methods can vary. Check your wallet before
              making a deposit.
            </p>
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-[110px] bg-[var(--bl)] text-white">
        <div className="max-w-[1180px] mx-auto px-6">
          <p className="font-black uppercase tracking-tight leading-[1.02] text-[clamp(28px,4.6vw,58px)] max-w-[1000px]">
            Simple to start. Clear to track.{" "}
            <span className="inline-grid place-items-center w-[0.9em] h-[0.9em] rounded-full bg-[var(--li)] text-[var(--ink)] align-[-0.1em] text-[0.8em] mx-[0.1em]">
              ✱
            </span>{" "}
            Order flows follow the selected service.
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
              Your orders don&apos;t have to wait for you.
            </h2>
            <p className="text-[var(--mu)] text-[19px] max-w-[520px] mt-4 mb-7">
              Galago routes requests through connected service providers and
              shows status updates in your account. Processing and delivery
              times depend on the service and provider.
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

      {/* FAQ */}
      <section id="faq" className="bg-white text-[var(--ink)] py-[100px]">
        <div className="max-w-[1180px] mx-auto px-6">
          <h2 className="font-black uppercase tracking-tight text-[clamp(34px,5vw,56px)] leading-[0.98] mb-10">
            Good to know
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                question: "When are wallet funds used?",
                answer:
                  "Your balance remains in your wallet until you choose a service and submit an order. The service determines whether funds are reserved or debited at that point.",
              },
              {
                question: "How long does an order take?",
                answer:
                  "Timing varies by product and provider. Follow the status shown in your account for the latest available update.",
              },
              {
                question: "What if a purchase fails?",
                answer:
                  "Galago uses the provider result to update the order. Where a purchase is confirmed as failed, any applicable refund or release follows that service's payment workflow.",
              },
              {
                question: "Which payment methods can I use?",
                answer:
                  "The available wallet funding methods are shown in your account and may vary by configuration and availability.",
              },
            ].map((item) => (
              <details key={item.question} className="rounded-2xl bg-[var(--of)] p-5">
                <summary className="cursor-pointer font-black">{item.question}</summary>
                <p className="mb-0 mt-3 text-[var(--mu)]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--li)] text-[var(--ink)] py-[100px] text-center">
        <div className="max-w-[1180px] mx-auto px-6">
          <h2 className="font-black uppercase tracking-tight text-[clamp(34px,5vw,56px)] leading-[0.98] mx-auto mb-4">
            Digital services. Simplified.
          </h2>
          <p className="max-w-[520px] mx-auto mb-8 font-medium text-[19px]">
            Manage your wallet, explore available services and follow your
            orders in one place.
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
            Create your account
          </Link>
        </div>
      </section>

      <footer className="bg-[var(--ink)] text-[#bfbbe8] py-8 text-sm">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8">
            <div className="col-span-2 md:col-span-1">
              <p className="text-white font-black uppercase tracking-wide mb-2">
                Galago
              </p>
              <p className="m-0 max-w-[220px]">
                Digital services, one wallet.
              </p>
            </div>
            <nav aria-label="Explore" className="flex flex-col items-start gap-2">
              <h2 className="text-white font-bold mb-1">Explore</h2>
              <a href="#services" className="hover:text-[var(--li)]">Services</a>
              <a href="#how" className="hover:text-[var(--li)]">How it works</a>
              <a href="#faq" className="hover:text-[var(--li)]">FAQs</a>
            </nav>
            <nav aria-label="Account" className="flex flex-col items-start gap-2">
              <h2 className="text-white font-bold mb-1">Account</h2>
              <Link href="/auth/signin" className="hover:text-[var(--li)]">Sign in</Link>
              <Link href="/auth/signup" className="hover:text-[var(--li)]">Create account</Link>
              <a href="mailto:ogumaeluan@gmail.com" className="hover:text-[var(--li)]">Contact support</a>
            </nav>
            <nav aria-label="Legal" className="flex flex-col items-start gap-2">
              <h2 className="text-white font-bold mb-1">Policies</h2>
              <Link href="/legal#privacy" className="hover:text-[var(--li)]">Privacy policy</Link>
              <Link href="/legal#terms" className="hover:text-[var(--li)]">Terms &amp; conditions</Link>
              <Link href="/legal#refunds" className="hover:text-[var(--li)]">Refunds &amp; cancellations</Link>
            </nav>
          </div>
          <div className="border-t border-white/20 pt-5 flex flex-wrap justify-between gap-3">
            <span>© {new Date().getFullYear()} Galago</span>
            <span>Operating in Nigeria</span>
          </div>
        </div>
      </footer>
      <GalagoChat />
    </main>
  );
}
