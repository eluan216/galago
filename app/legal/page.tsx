import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Policies | Galago",
  description:
    "Galago's privacy policy, terms and conditions, and refund and cancellation information.",
};

const lastUpdated = "November 20, 2026";

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[var(--of)] text-[var(--ink)]">
      <header className="bg-[var(--bl)] text-white py-12">
        <div className="max-w-[900px] mx-auto px-6">
          <Link href="/" className="text-[var(--li)] font-bold hover:underline">
            Back to Galago
          </Link>
          <h1 className="mt-6 mb-3 text-4xl sm:text-5xl font-black uppercase tracking-tight">
            Policies
          </h1>
          <p className="m-0 text-white/80">Last updated: {lastUpdated}</p>
        </div>
      </header>

      <div className="max-w-[900px] mx-auto px-6 py-10 space-y-8">
        <aside className="rounded-2xl border-2 border-amber-500/50 bg-amber-50 p-5 text-sm text-[var(--ink)]">
          <strong>Draft for review.</strong> This page reflects the current
          Galago application and is not legal advice. Have it reviewed under
          applicable Nigerian law before relying on it as a final policy.
        </aside>

        <nav aria-label="Policy sections" className="flex flex-wrap gap-3">
          <a className="btn-galago btn-galago-sm" href="#privacy">Privacy policy</a>
          <a className="btn-galago btn-galago-sm" href="#terms">Terms &amp; conditions</a>
          <a className="btn-galago btn-galago-sm" href="#refunds">Refunds &amp; cancellations</a>
        </nav>

        <section id="privacy" className="scroll-mt-6 rounded-2xl bg-white p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-black uppercase">Privacy policy</h2>
          <p>
            This policy explains how Galago, a digital services marketplace
            operating in Nigeria, processes information when you use its
            website, wallet, and services.
          </p>

          <h3 className="mt-6 font-bold">Information the service uses</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Account information, including your email address and account
              identifier, used for authentication and account management.
            </li>
            <li>
              Essential authentication cookies used to maintain your signed-in
              session.
            </li>
            <li>
              Wallet and transaction records, including amounts, balances,
              payment references, networks, order status, and timestamps.
            </li>
            <li>
              Details needed to fulfil a service, such as a mobile number,
              meter or decoder reference, selected product, and quantity.
            </li>
            <li>
              For eSIM orders, package and provider status details and, when
              issued, profile information such as ICCID, activation code, QR
              code URL, EID, and usage data.
            </li>
          </ul>

          <h3 className="mt-6 font-bold">Why information is processed</h3>
          <p>
            Galago uses this information to authenticate users, operate wallets,
            process deposits and purchases, fulfil and reconcile orders, show
            transaction history, protect the service, and meet applicable legal
            obligations.
          </p>

          <h3 className="mt-6 font-bold">Service providers and sharing</h3>
          <p>
            Information is shared with providers only as needed for the
            requested operation. The current integrations include Supabase
            (authentication and database hosting), Vercel (application
            hosting), Paystack (Naira payments), NOWPayments (crypto invoices),
            VTpass (bill purchases), and eSIM Access (eSIM orders and
            profiles). Galago also requests public reference exchange rates
            from Frankfurter. Each provider handles information under its own
            terms and privacy practices; some processing may occur outside
            Nigeria.
          </p>
          <p>
            Payment details are submitted to the selected payment provider.
            Galago&apos;s application initiates payments and records their
            references and status; it does not ask users to send payment
            credentials to Galago staff.
          </p>

          <h3 className="mt-6 font-bold">Storage, security, and retention</h3>
          <p>
            Account and transaction information is stored in the application&apos;s
            Supabase database. Galago uses server-side credentials for
            privileged operations and access controls for account records.
            No online service can guarantee absolute security. Records are
            retained for as long as needed to operate the account, reconcile
            payments and orders, address disputes or security issues, and
            satisfy applicable legal obligations. The project does not define
            fixed retention periods.
          </p>

          <h3 className="mt-6 font-bold">Your choices and requests</h3>
          <p>
            You may request access to or correction of your account information
            and may request deletion where applicable law permits. Some
            transaction records may need to be retained for reconciliation,
            security, or legal reasons. To make a privacy request, contact
            Galago using the address in the Contact section below.
          </p>
        </section>

        <section id="terms" className="scroll-mt-6 rounded-2xl bg-white p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-black uppercase">
            Terms &amp; conditions
          </h2>
          <p>
            By creating an account or using Galago, you agree to use the
            platform lawfully and provide accurate information needed to
            process your requests. These terms describe the current service
            flows and are subject to mandatory rights under Nigerian law.
          </p>

          <h3 className="mt-6 font-bold">Wallet and payments</h3>
          <p>
            The wallet balance is denominated in Nigerian naira. A displayed
            currency conversion is for reference and does not change the
            underlying naira balance. Available funding methods are shown in
            the wallet and may depend on provider and account configuration.
            Deposits are credited after the payment provider confirms them.
          </p>

          <h3 className="mt-6 font-bold">Orders and providers</h3>
          <p>
            Service catalogues, prices, eligibility, and delivery times may
            change based on provider availability. Review the recipient,
            account reference, selected product, and amount before submitting
            an order. You are responsible for supplying correct details.
            Provider acceptance alone does not mean an order has been
            fulfilled; pending orders remain pending until the available
            provider status confirms an outcome.
          </p>

          <h3 className="mt-6 font-bold">Product-specific payment flows</h3>
          <p>
            Some marketplace orders reserve wallet funds and settle or release
            them when their outcome is confirmed. Bill purchases and eSIM
            orders use their own provider and reconciliation workflows; they
            do not necessarily use a hold. Do not submit a duplicate purchase
            while an earlier request is still pending.
          </p>

          <h3 className="mt-6 font-bold">eSIM pricing and cancellation</h3>
          <p>
            When eSIM purchases are enabled, Galago converts provider pricing
            using reference exchange rates and currently applies a 7% markup.
            The eSIM purchase feature may be unavailable while provider access
            is being configured. Cancellation is subject to provider approval
            and eligibility; installed, used, or otherwise ineligible profiles
            may not be cancelled or refunded.
          </p>

          <h3 className="mt-6 font-bold">Availability and changes</h3>
          <p>
            Galago and its providers may be unavailable or delayed. Galago
            does not promise a particular delivery time or uninterrupted
            provider service. These terms may be updated as features and
            provider arrangements change; the revision date above will be
            updated when the policy changes.
          </p>
        </section>

        <section id="refunds" className="scroll-mt-6 rounded-2xl bg-white p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-black uppercase">
            Refunds &amp; cancellations
          </h2>
          <p>
            Refunds depend on the service and confirmed provider outcome.
            Galago does not treat an unknown or pending provider response as a
            confirmed failure.
          </p>

          <ul className="list-disc pl-6 space-y-3">
            <li>
              <strong>Hold-based marketplace orders:</strong> funds reserved
              for an order are settled after confirmed delivery or released
              after a confirmed failure.
            </li>
            <li>
              <strong>VTpass bills:</strong> a confirmed failed purchase is
              refunded to the Galago wallet through the transaction workflow.
              If the provider outcome is pending or uncertain, the transaction
              remains pending while its status is checked; do not retry until
              it is resolved.
            </li>
            <li>
              <strong>eSIM orders:</strong> a confirmed provider rejection can
              be refunded to the wallet after reconciliation. A delivered
              eSIM cancellation is considered only when the provider confirms
              the profile is eligible, unused, and cancellable. Used or
              installed profiles are not eligible under the current flow.
            </li>
            <li>
              <strong>Payment deposits:</strong> a wallet credit depends on
              confirmation from Paystack or NOWPayments. If a provider
              confirms payment but the wallet is not updated, the payment
              reference is needed to investigate the deposit.
            </li>
          </ul>

          <p className="mt-6">
            Refunds described here are wallet ledger adjustments unless the
            relevant payment provider separately confirms a reversal. Timing
            depends on provider confirmation and reconciliation; the
            application does not promise a fixed processing period.
          </p>
        </section>

        <section id="contact" className="scroll-mt-6 rounded-2xl bg-white p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-black uppercase">Contact Galago</h2>
          <p>
            For privacy requests or help with an unresolved payment or order,
            email{" "}
            <a className="text-[var(--bl)] underline" href="mailto:ogumaeluan@gmail.com">
              ogumaeluan@gmail.com
            </a>
            . Include your Galago account email and relevant transaction or
            order reference. Never send your password, full payment-card
            details, or provider/API secrets.
          </p>
        </section>
      </div>
    </main>
  );
}
