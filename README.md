# Galago

Galago is my Nigeria-focused digital services marketplace. It brings wallet
funding, supported bill payments, eSIM plans, and service-order tracking into
one account.

The project is built with Next.js, TypeScript, Tailwind CSS, and Supabase. It
uses provider integrations for payment and service fulfilment; provider
availability and delivery times can vary.

## What is available

- Supabase email and Google authentication.
- A naira wallet and transaction ledger.
- Wallet funding through Paystack and NOWPayments, when configured.
- VTpass airtime, data, electricity, TV, and education purchases.
- A service marketplace with hold, settle, and release flows for eligible
  orders.
- An eSIM catalogue, order tracking, profile delivery, usage lookup, and
  eligible cancellation workflows.
- Currency display conversion using Frankfurter reference rates.

Some provider operations are configuration-gated. Bill purchases require
VTpass live credentials in production, and eSIM purchases remain disabled
until live provider access and funding are confirmed.

## Run locally

### Requirements

- Node.js compatible with Next.js 15.
- A Supabase project.
- Provider credentials for whichever payment or service integrations you want
  to test.

### Setup

```bash
git clone https://github.com/eluan216/galago.git
cd galago
npm install
cp .env.example .env.local
```

Fill in the environment variables you need in `.env.local`, then start the
development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Start with [.env.example](./.env.example). Keep secret values server-side and
never commit `.env.local`, provider credentials, or service-role keys.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key used by the app |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged database operations |
| `NEXT_PUBLIC_APP_URL` | Public app URL used for provider callbacks |
| `PAYSTACK_SECRET_KEY` | Paystack wallet funding |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key, if required by the client |
| `NOWPAYMENTS_API_KEY` | NOWPayments invoice creation |
| `NOWPAYMENTS_IPN_SECRET` | Verify NOWPayments payment notifications |
| `VTPASS_API_KEY` | VTpass API key |
| `VTPASS_PUBLIC_KEY` | VTpass public key |
| `VTPASS_SECRET_KEY` | VTpass secret key |
| `VTPASS_ENVIRONMENT` | `sandbox` or `live`; production purchases require `live` |
| `ESIM_ACCESS_CODE` | eSIM Access code; keep server-side |
| `ESIM_ACCESS_PURCHASES_ENABLED` | Must be `true` to enable eSIM purchases; defaults to `false` |

Set production secrets in your hosting provider's environment-variable
settings, not in source files or `NEXT_PUBLIC_*` variables.

## Provider setup

### VTpass

Begin with sandbox credentials and `VTPASS_ENVIRONMENT=sandbox`. Verify
catalogue, purchase, and status-requery behavior before requesting live access.
Production purchases are blocked unless `VTPASS_ENVIRONMENT=live`.

### eSIM Access and exchange rates

eSIM Access does not provide a sandbox. Keep
`ESIM_ACCESS_PURCHASES_ENABLED=false` until reseller access, Nigeria merchant
eligibility, provider funding, and a live test are confirmed. The app does not
mark an eSIM order delivered until a usable provider profile is confirmed.

eSIM prices are converted to naira using Frankfurter reference rates and the
current 7% markup. The rates are not real-time market quotes. The wallet stays
naira-denominated; display-currency selection does not change the stored
balance.

### Payment providers

Paystack confirms naira deposits through its callback flow. NOWPayments
confirms crypto deposits through its signed webhook. A deposit is not credited
until its provider confirmation is accepted.

## How wallet and order flows work

Amounts are stored as integer kobo. Eligible marketplace orders reserve wallet
funds and settle or release them after the order outcome is confirmed. VTpass
bills and eSIM purchases use provider-specific debit, status, and refund
workflows; they do not all use the same hold flow.

An uncertain provider result remains pending for reconciliation. Do not retry
a pending purchase until its status is resolved.

## Database migrations

Supabase migrations live in [`supabase/migrations`](./supabase/migrations).
They use PostgreSQL syntax. This repository has known differences between
local and remote migration history, so do not run `supabase db push` until the
histories are reconciled. Review and apply migrations through the established
deployment workflow.

### VS Code SQL diagnostics

If VS Code reports syntax errors such as `Incorrect syntax near 'public'` or
complains about `uuid`, row-level security, or `create or replace function`
in these migrations, check that the files are being parsed as PostgreSQL, not
SQL Server (T-SQL). Do not rewrite valid Supabase migrations to satisfy a
T-SQL parser.

## Checks

Run these before submitting changes:

```bash
npm test
npx tsc --noEmit
npm run build
```

## Project layout

| Path | Contents |
| --- | --- |
| `app/` | Pages, layouts, and API route handlers |
| `components/` | Shared UI components |
| `lib/` | Provider clients, pricing, and Supabase helpers |
| `supabase/migrations/` | PostgreSQL schema and wallet operations |
| `tests/` | Focused tests for service and payment logic |

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/legal` | Draft privacy, terms, refund, and contact information |
| `/auth/signin`, `/auth/signup` | Account access |
| `/dashboard` | User overview |
| `/dashboard/wallet` | Wallet funding, balance, and ledger |
| `/dashboard/orders` | Marketplace order history |
| `/dashboard/orders/new` | Create an eligible marketplace order |
| `/dashboard/bills` | VTpass catalogue, verification, purchases, and status |
| `/dashboard/esim` | eSIM destinations, packages, orders, and profiles |

The `/api/fiat`, `/api/crypto`, `/api/orders`, `/api/vtpass`, `/api/esim`, and
`/api/currency` route handlers implement the related server-side operations.

## Legal and operational notes

The `/legal` page is a working draft based on the current application, not
legal advice. Review it under Nigerian law and keep its retention, contact, and
refund details aligned with actual business practices before treating it as
final.
