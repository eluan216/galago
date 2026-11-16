# Galago

**Galago — the bushbaby.** African, nocturnal, enormous eyes. Grow while you sleep.

Nigerian digital marketplace connect platform. Unified Naira wallet for:
- Social media growth (real engagement)
- Airtime / Data / Bills (VTU)
- Virtual numbers & OTP
- Gift cards, virtual cards, game top-ups
- eSIM
- Reseller / white-label / API
- **Crypto funding (USDT + more)**

Domain target: **galago.ng**

---

## Brand Kit

### Colors (dark-first)
| Token | Hex | Use |
|-------|-----|-----|
| Night Black | `#0B0F14` | Background |
| Bush Deep | `#121A22` | Cards / surfaces |
| Galago Gold | `#E8B923` | Primary accent / CTAs / eyes |
| Amber Glow | `#F5C84B` | Hover / secondary |
| Moon White | `#F4F1EA` | Primary text |
| Mist | `#A8B2C1` | Secondary text |
| Success | `#2DD4A8` | Positive states |
| Danger | `#F87171` | Errors / alerts |

### Typography
- Headings: Outfit or Sora
- Body: Inter / Geist
- Mono: JetBrains Mono (wallet amounts, order IDs, crypto addresses)

### Voice
Confident, Nigerian, nocturnal energy. Clear English + natural Pidgin where it fits. Never loud or scammy.

---

## Architecture Overview

```
[Users / Resellers / API / Crypto wallets]
              │
              ▼
┌─────────────────────────────────────────────┐
│  Next.js 15 (App Router) · Vercel           │
│  Marketing · Dashboard · PWA · Edge Middleware│
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Supabase (Postgres + Auth + Realtime + Storage)│
│  • Auth (email / Google / phone OTP)        │
│  • Immutable wallet ledger                  │
│  • Orders + status events                   │
│  • Catalog / Providers / API keys           │
└──────────────┬──────────────┬───────────────┘
               │              │
               ▼              ▼
     ┌─────────────────┐  ┌──────────────────────┐
     │ Fiat rails      │  │ Crypto rails         │
     │ Paystack /      │  │ USDT (TRC20/ERC20)   │
     │ Flutterwave /   │  │ + BTC / ETH later    │
     │ Bank transfer   │  │ NOWPayments /        │
     │                 │  │ Quidax / direct watch│
     └─────────────────┘  └──────────────────────┘
               │              │
               └──────┬───────┘
                      ▼
            Provider Adapters
            (SMM · VTU · SMS · Cards · eSIM)
```

### Core principles
1. **Hold-until-delivered** — funds are reserved, only settled on confirmed delivery (or partial).
2. **Single Naira wallet** — all services debit the same balance.
3. **Crypto as funding source** — users deposit crypto → auto or semi-auto convert to NGN wallet balance.
4. **Provider-agnostic catalog** — offers carry rate (kobo), constraints, quality tier, targeting.
5. **Reseller-first** — markup, white-label, scoped API keys, webhooks from day one.
6. **Idempotent + audited** — every money movement is immutable ledger entry.

---

## Crypto Payment Design

### Goals
- Let users fund their Galago Naira wallet with crypto (primarily **USDT**).
- Keep the internal ledger and order settlement 100% in NGN/kobo (simplicity + regulatory clarity).
- Support future direct crypto settlement if needed.

### Recommended flow (Phase 1)
1. User selects “Fund with Crypto” → chooses network (TRC20 preferred for low fees in NG, ERC20 secondary).
2. System generates a unique deposit address (or uses a payment provider invoice).
3. User sends USDT.
4. On confirmed on-chain payment (webhook or watcher):
   - Convert at live rate (or locked rate for the invoice window).
   - Credit `ledger_entries` with type `crypto_deposit` and the NGN equivalent.
   - Update wallet balance.
5. Optional: small conversion fee or spread (transparent).

### Provider options (pick one to start)
| Provider | Pros | Notes |
|----------|------|-------|
| **NOWPayments** | Easy invoices, many coins, webhooks | Good starting point |
| **Quidax** | Nigerian, local support, USDT focus | Strong for NG market |
| **Binance Pay** | High trust in NG | Merchant account needed |
| Direct wallet watch (own node / Blockchair / TronGrid) | Full control | More ops work |

**Recommendation**: Start with **NOWPayments** or **Quidax** for speed, then add direct TRC20 watching later if volume justifies it.

### Data model additions
```sql
-- crypto_deposits
id              uuid primary key
user_id         uuid references profiles
provider        text          -- 'nowpayments' | 'quidax' | 'direct'
external_id     text          -- invoice / payment id
network         text          -- 'TRC20' | 'ERC20' | 'BTC' ...
currency        text          -- 'USDT'
amount_crypto   numeric
amount_ngn_kobo bigint
rate            numeric
status          text          -- pending | confirmed | expired | failed
tx_hash         text
created_at      timestamptz
confirmed_at    timestamptz
```

Ledger entry type: `crypto_deposit` (credits the Naira wallet).

### Security & ops notes
- Never store private keys in the app.
- Use provider webhooks with signature verification.
- Rate-limit address generation.
- Show clear network warnings (wrong network = lost funds).
- Support memo/tag if the provider requires it.
- Audit every conversion rate used.

### Future phases
- Multi-coin (BTC, ETH, SOL, local stablecoins).
- Optional crypto balance (keep USDT in wallet and pay orders in crypto).
- Reseller crypto payouts.
- On-ramp / off-ramp partnerships.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 15 (App Router) + Tailwind + shadcn/ui |
| Auth | Supabase Auth |
| Database | Supabase Postgres + RLS |
| Realtime | Supabase Realtime |
| Payments (fiat) | Paystack / Flutterwave |
| Payments (crypto) | NOWPayments or Quidax (Phase 1) |
| Background jobs | Vercel Cron + Inngest or Supabase Edge Functions |
| Hosting | Vercel |
| Domain | galago.ng |

---

## Project Status

- GitHub: https://github.com/eluan216/galago
- Supabase project: `galago` (eu-west-1)
- Vercel project: linked and deploying

---

## Next steps

1. Scaffold Next.js app with brand tokens
2. Supabase schema (profiles, wallets, ledger, orders, crypto_deposits)
3. Auth + basic wallet UI
4. Fiat funding (Paystack)
5. Crypto funding integration
6. Catalog + order flow
7. Reseller API layer

Built for speed, real delivery, and African scale.
