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

## Current Status (Nov 2026)

| Area | Status |
|------|--------|
| GitHub + Vercel + Supabase | Connected |
| Brand kit + design tokens | Done |
| Database schema (wallet, ledger, crypto, orders) | Live |
| Next.js 15 scaffold + dark theme | Done |
| Auth (email + Google) | Done |
| Dashboard + Wallet UI | Done |
| Crypto (NOWPayments) create + webhook | Done |
| Fiat funding (Paystack) | Next |
| Catalog + order placement | Next |
| Reseller API | Later |

---

## Brand Kit

### Colors (dark-first)
| Token | Hex | Use |
|-------|-----|-----|
| Night Black | `#0B0F14` | Background |
| Bush Deep | `#121A22` | Cards / surfaces |
| Galago Gold | `#E8B923` | Primary accent / CTAs |
| Amber Glow | `#F5C84B` | Hover |
| Moon White | `#F4F1EA` | Primary text |
| Mist | `#A8B2C1` | Secondary text |
| Success | `#2DD4A8` | Positive |
| Danger | `#F87171` | Errors |

### Typography
- Headings: Outfit / Sora
- Body: Inter / Geist
- Mono: JetBrains Mono

---

## Architecture

See `docs/architecture.md` for the full design.

**Core idea**: Single Naira wallet. Crypto (and later fiat) only funds the wallet. All services debit the same balance. Hold-until-delivered for orders.

### Crypto flow
1. User enters amount → `/api/crypto/create-invoice`
2. NOWPayments invoice created (USDT-TRC20 preferred)
3. Webhook confirms → credit wallet + immutable ledger entry

---

## Local setup

```bash
git clone https://github.com/eluan216/galago.git
cd galago
cp .env.example .env.local
# fill in Supabase + NOWPayments keys
npm install
npm run dev
```

Required env vars:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
```

---

## Project links

- Repo: https://github.com/eluan216/galago
- Supabase: `uqqxtdrjjvmzfqoycpdt` (eu-west-1)
- Vercel: linked to main branch

Built for speed, real delivery, and African scale.
