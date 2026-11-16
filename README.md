# Galago

**Galago — the bushbaby.** African, nocturnal, enormous eyes. Grow while you sleep.

Nigerian digital marketplace. Unified Naira wallet for social growth, VTU, numbers, cards, eSIM + **crypto & fiat funding**.

---

## Current Status

| Area | Status |
|------|--------|
| GitHub + Vercel + Supabase | Connected |
| Brand + dark theme | Done |
| Schema (wallet, ledger, crypto, orders, catalog) | Live + seeded |
| Auth (email + Google) | Done |
| Dashboard + Wallet UI | Done |
| Crypto funding (NOWPayments USDT) | Done |
| **Fiat funding (Paystack)** | Done |
| **Service catalog + New Order** | Done |
| **Hold → Settle order logic** | Done |
| Reseller API | Next |
| Real provider adapters | Next |

---

## How money works

1. **Fund** wallet with Paystack (card/bank/USSD) or USDT (TRC20).
2. **Place order** → funds are **held** (deducted + ledger `hold`).
3. When delivery is confirmed → order moves to `completed` (settle).
4. If order fails → release path can return funds (to be expanded).

All amounts are stored in **kobo** (integer).

---

## Quick start

```bash
git clone https://github.com/eluan216/galago.git
cd galago
cp .env.example .env.local
# fill keys
npm install
npm run dev
```

Required env:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
PAYSTACK_SECRET_KEY=
```

---

## Key routes

- `/` — Landing
- `/auth/signin` · `/auth/signup`
- `/dashboard` — Overview
- `/dashboard/wallet` — Fund (Paystack + USDT) + ledger
- `/dashboard/orders` — List
- `/dashboard/orders/new` — Place order (hold funds)

API:
- `POST /api/fiat/initialize` · `GET /api/fiat/callback`
- `POST /api/crypto/create-invoice` · `POST /api/crypto/webhook`
- `POST /api/orders/create`
- `POST /api/orders/[id]/complete`

---

Built for speed, real delivery, and African scale.
