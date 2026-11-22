-- The catalogue sync used to run only from a signed-in visitor's page load.
-- Ops sometimes need to refresh it without a browser, so a refresh can be
-- requested in the database: GET /api/catalog/sync runs one sync only while
-- this timestamp is set, then clears it. That keeps the endpoint from being a
-- standing public trigger.

alter table public.catalog_sync
  add column if not exists refresh_requested_at timestamptz;

comment on column public.catalog_sync.refresh_requested_at is
  'Set by ops to authorise one GET /api/catalog/sync refresh without a session. Cleared after a successful sync.';
