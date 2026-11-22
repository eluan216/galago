-- The new-order picker only showed the handful of offers that were seeded by
-- hand (2 for TikTok, 2 for YouTube). Owlet publishes thousands of services,
-- so the catalogue is now synced from Owlet: platforms → services (categories)
-- → offers (individual Owlet service ids, priced at Owlet's rate + 10%).
--
-- This migration adds the columns/keys that sync needs. Upserts are keyed on
-- offers.provider_code (the Owlet service id) so re-running the sync reprices
-- existing rows instead of duplicating them.

alter table public.services
  add column if not exists category text;

-- NULLs stay distinct in a btree unique index, so rows without a platform are
-- unaffected.
create unique index if not exists services_platform_name_key
  on public.services (platform_id, name);

create unique index if not exists offers_provider_code_key
  on public.offers (provider_code);

create table if not exists public.catalog_sync (
  provider text primary key,
  synced_at timestamptz not null default now(),
  service_count integer not null default 0,
  fx_rate numeric(14, 4),
  note text
);

alter table public.catalog_sync enable row level security;
revoke all on table public.catalog_sync from anon, authenticated;
