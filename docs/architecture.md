# Galago Architecture

## High-level components

1. **Web App** (Next.js 15 App Router on Vercel)
   - Public marketing + catalog
   - Authenticated dashboard (wallet, orders, reseller tools)
   - PWA
   - Edge middleware for auth, rate limiting, geo

2. **Supabase**
   - Auth (email, Google, phone OTP)
   - Postgres with Row Level Security
   - Realtime for order status
   - Storage for proofs / assets

3. **Wallet & Ledger**
   - Single Naira balance per user
   - Immutable `ledger_entries` table
   - Entry types: fund_fiat, fund_crypto, hold, settle, release, refund, fee, adjustment
   - All amounts in kobo (integer)

4. **Order Engine**
   - Create → Hold funds → Dispatch to provider → Track → Settle / partial / refund
   - Idempotency key on create
   - Full event history

5. **Provider Adapters**
   - SMM, VTU, SMS/OTP, Cards, eSIM, etc.
   - Unified interface: create, status, cancel, webhook handler

6. **Crypto Funding**
   - User generates deposit invoice / address
   - Provider webhook or on-chain watcher confirms
   - Convert to NGN at locked or live rate
   - Credit ledger as `crypto_deposit`

7. **Reseller Layer**
   - Markup rules
   - White-label storefront
   - Scoped API keys + webhooks

## Crypto payment details

See main README for the full crypto design.

Primary path: Crypto → NGN wallet credit → spend on any service.

This keeps order settlement, refunds, and reporting simple while giving users the funding method they actually want in Nigeria.
