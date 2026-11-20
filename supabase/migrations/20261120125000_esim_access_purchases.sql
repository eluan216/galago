alter table public.ledger_entries
  drop constraint if exists ledger_entries_type_check;

alter table public.ledger_entries
  add constraint ledger_entries_type_check
  check (
    type = any (
      array[
        'fund_fiat',
        'fund_crypto',
        'hold',
        'settle',
        'release',
        'refund',
        'fee',
        'adjustment',
        'crypto_deposit',
        'vtpass_purchase',
        'vtpass_refund',
        'esim_purchase',
        'esim_refund'
      ]::text[]
    )
  );

create table if not exists public.esim_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key uuid not null,
  transaction_id text not null unique,
  provider_order_no text,
  package_code text not null,
  package_name text not null,
  package_slug text,
  location_code text not null,
  provider_price_units bigint not null check (provider_price_units > 0),
  provider_currency text not null,
  fx_rate_ngn_per_unit numeric(24, 12) not null check (fx_rate_ngn_per_unit > 0),
  markup_percent numeric(5, 2) not null check (markup_percent >= 0),
  charge_kobo bigint not null check (charge_kobo > 0),
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'failed', 'cancelled')),
  provider_error text,
  provider_cancel_confirmed_at timestamptz,
  profiles jsonb not null default '[]'::jsonb
    check (jsonb_typeof(profiles) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists esim_orders_user_created_idx
  on public.esim_orders (user_id, created_at desc);

alter table public.esim_orders enable row level security;

drop policy if exists "Users can view their eSIM orders"
  on public.esim_orders;
create policy "Users can view their eSIM orders"
  on public.esim_orders
  for select
  using (auth.uid() = user_id);

grant select on public.esim_orders to authenticated;
grant all on public.esim_orders to service_role;

create or replace function public.esim_start_purchase(
  p_user_id uuid,
  p_idempotency_key uuid,
  p_transaction_id text,
  p_package_code text,
  p_package_name text,
  p_package_slug text,
  p_location_code text,
  p_provider_price_units bigint,
  p_provider_currency text,
  p_fx_rate_ngn_per_unit numeric,
  p_markup_percent numeric,
  p_charge_kobo bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing esim_orders%rowtype;
  v_wallet wallets%rowtype;
  v_order esim_orders%rowtype;
  v_new_balance bigint;
begin
  if p_user_id is null
    or p_idempotency_key is null
    or p_transaction_id is null
    or p_transaction_id !~ '^[A-Za-z0-9_-]{1,50}$'
    or p_package_code is null
    or p_package_name is null
    or p_location_code is null
    or p_provider_currency is null
    or p_provider_currency !~ '^[A-Z]{3}$'
    or p_provider_price_units is null
    or p_provider_price_units <= 0
    or p_fx_rate_ngn_per_unit is null
    or p_fx_rate_ngn_per_unit <= 0
    or p_markup_percent is null
    or p_markup_percent < 0
    or p_charge_kobo is null
    or p_charge_kobo <= 0
  then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || p_idempotency_key::text, 0)
  );

  select * into v_existing
  from esim_orders
  where user_id = p_user_id and idempotency_key = p_idempotency_key
  limit 1;
  if found then
    return jsonb_build_object(
      'ok', true,
      'created', false,
      'id', v_existing.id,
      'transaction_id', v_existing.transaction_id,
      'provider_order_no', v_existing.provider_order_no,
      'status', v_existing.status,
      'charge_kobo', v_existing.charge_kobo,
      'profiles', v_existing.profiles
    );
  end if;

  select * into v_wallet
  from wallets
  where user_id = p_user_id
  for update;
  if not found then
    insert into wallets (user_id, balance_kobo, currency)
    values (p_user_id, 0, 'NGN')
    returning * into v_wallet;
  end if;

  select * into v_existing
  from esim_orders
  where user_id = p_user_id
    and package_code = p_package_code
    and location_code = p_location_code
    and status = 'pending'
  order by created_at desc
  limit 1;
  if found then
    return jsonb_build_object(
      'ok', true,
      'created', false,
      'id', v_existing.id,
      'transaction_id', v_existing.transaction_id,
      'provider_order_no', v_existing.provider_order_no,
      'status', v_existing.status,
      'charge_kobo', v_existing.charge_kobo,
      'profiles', v_existing.profiles
    );
  end if;

  if v_wallet.balance_kobo < p_charge_kobo then
    return jsonb_build_object(
      'ok', false,
      'code', 'insufficient_balance',
      'balance_kobo', v_wallet.balance_kobo
    );
  end if;

  v_new_balance := v_wallet.balance_kobo - p_charge_kobo;
  update wallets
  set balance_kobo = v_new_balance, updated_at = now()
  where id = v_wallet.id;

  insert into esim_orders (
    user_id, idempotency_key, transaction_id, package_code, package_name,
    package_slug, location_code, provider_price_units, provider_currency,
    fx_rate_ngn_per_unit, markup_percent, charge_kobo
  )
  values (
    p_user_id, p_idempotency_key, p_transaction_id, p_package_code, p_package_name,
    p_package_slug, p_location_code, p_provider_price_units, p_provider_currency,
    p_fx_rate_ngn_per_unit, p_markup_percent, p_charge_kobo
  )
  returning * into v_order;

  insert into ledger_entries (
    wallet_id, user_id, type, amount_kobo, balance_after_kobo,
    reference_type, reference_id, description, metadata
  )
  values (
    v_wallet.id, p_user_id, 'esim_purchase', -p_charge_kobo, v_new_balance,
    'esim', v_order.id, 'eSIM purchase: ' || p_package_name,
    jsonb_build_object(
      'transaction_id', p_transaction_id,
      'package_code', p_package_code,
      'provider_currency', p_provider_currency,
      'fx_rate_ngn_per_unit', p_fx_rate_ngn_per_unit,
      'markup_percent', p_markup_percent
    )
  );

  return jsonb_build_object(
    'ok', true,
    'created', true,
    'id', v_order.id,
    'transaction_id', v_order.transaction_id,
    'status', v_order.status,
    'charge_kobo', v_order.charge_kobo,
    'balance_after_kobo', v_new_balance
  );
end;
$$;

create or replace function public.esim_update_purchase(
  p_user_id uuid,
  p_transaction_id text,
  p_status text,
  p_provider_order_no text default null,
  p_provider_error text default null,
  p_profiles jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order esim_orders%rowtype;
  v_wallet wallets%rowtype;
  v_new_balance bigint;
begin
  if p_user_id is null
    or p_transaction_id is null
    or p_status is null
    or p_status not in ('pending', 'delivered', 'failed')
    or (p_profiles is not null and jsonb_typeof(p_profiles) <> 'array')
    or (
      p_status = 'delivered'
      and (
        p_profiles is null
        or jsonb_typeof(p_profiles) <> 'array'
        or case
          when jsonb_typeof(p_profiles) = 'array'
            then jsonb_array_length(p_profiles) <> 1
          else true
        end
        or p_profiles->0->>'esimStatus' <> 'GOT_RESOURCE'
        or p_profiles->0->>'smdpStatus' <> 'RELEASED'
      )
    )
  then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  select * into v_order
  from esim_orders
  where transaction_id = p_transaction_id and user_id = p_user_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_order.status <> 'pending' then
    return jsonb_build_object(
      'ok', true,
      'status', v_order.status,
      'already_resolved', true,
      'profiles', v_order.profiles
    );
  end if;

  update esim_orders
  set status = p_status,
      provider_order_no = coalesce(p_provider_order_no, provider_order_no),
      provider_error = p_provider_error,
      profiles = coalesce(p_profiles, profiles),
      updated_at = now()
  where id = v_order.id;

  if p_status = 'failed' then
    select * into v_wallet
    from wallets
    where user_id = p_user_id
    for update;
    if not found then
      raise exception 'Wallet missing while refunding eSIM order %', v_order.id;
    end if;

    v_new_balance := v_wallet.balance_kobo + v_order.charge_kobo;
    update wallets
    set balance_kobo = v_new_balance, updated_at = now()
    where id = v_wallet.id;

    insert into ledger_entries (
      wallet_id, user_id, type, amount_kobo, balance_after_kobo,
      reference_type, reference_id, description, metadata
    )
    values (
      v_wallet.id, p_user_id, 'esim_refund', v_order.charge_kobo, v_new_balance,
      'esim', v_order.id, 'Refund for failed eSIM order',
      jsonb_build_object('transaction_id', p_transaction_id)
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'status', p_status,
    'profiles', coalesce(p_profiles, v_order.profiles)
  );
end;
$$;

create or replace function public.esim_cancel_purchase(
  p_user_id uuid,
  p_transaction_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order esim_orders%rowtype;
  v_wallet wallets%rowtype;
  v_new_balance bigint;
begin
  select * into v_order
  from esim_orders
  where transaction_id = p_transaction_id and user_id = p_user_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_order.status = 'cancelled' then
    return jsonb_build_object('ok', true, 'status', 'cancelled', 'already_resolved', true);
  end if;
  if v_order.status <> 'delivered' then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  if v_order.provider_cancel_confirmed_at is null then
    return jsonb_build_object('ok', false, 'code', 'provider_cancellation_not_confirmed');
  end if;

  select * into v_wallet
  from wallets
  where user_id = p_user_id
  for update;
  if not found then
    raise exception 'Wallet missing while refunding eSIM order %', v_order.id;
  end if;

  v_new_balance := v_wallet.balance_kobo + v_order.charge_kobo;
  update wallets
  set balance_kobo = v_new_balance, updated_at = now()
  where id = v_wallet.id;

  update esim_orders
  set status = 'cancelled', updated_at = now()
  where id = v_order.id;

  insert into ledger_entries (
    wallet_id, user_id, type, amount_kobo, balance_after_kobo,
    reference_type, reference_id, description, metadata
  )
  values (
    v_wallet.id, p_user_id, 'esim_refund', v_order.charge_kobo, v_new_balance,
    'esim', v_order.id, 'Refund for cancelled eSIM order',
    jsonb_build_object('transaction_id', p_transaction_id)
  );

  return jsonb_build_object('ok', true, 'status', 'cancelled');
end;
$$;

create or replace function public.esim_mark_cancel_confirmed(
  p_user_id uuid,
  p_transaction_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order esim_orders%rowtype;
begin
  select * into v_order
  from esim_orders
  where transaction_id = p_transaction_id and user_id = p_user_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  if v_order.status = 'cancelled' then
    return jsonb_build_object('ok', true, 'status', 'cancelled', 'already_resolved', true);
  end if;
  if v_order.status <> 'delivered' then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;

  update esim_orders
  set provider_cancel_confirmed_at = coalesce(provider_cancel_confirmed_at, now()),
      updated_at = now()
  where id = v_order.id;

  return jsonb_build_object('ok', true, 'status', 'cancellation_confirmed');
end;
$$;

revoke all on function public.esim_start_purchase(
  uuid, uuid, text, text, text, text, text, bigint, text, numeric, numeric, bigint
) from public;
revoke all on function public.esim_update_purchase(
  uuid, text, text, text, text, jsonb
) from public;
revoke all on function public.esim_cancel_purchase(uuid, text) from public;
revoke all on function public.esim_mark_cancel_confirmed(uuid, text) from public;

grant execute on function public.esim_start_purchase(
  uuid, uuid, text, text, text, text, text, bigint, text, numeric, numeric, bigint
) to service_role;
grant execute on function public.esim_update_purchase(
  uuid, text, text, text, text, jsonb
) to service_role;
grant execute on function public.esim_cancel_purchase(uuid, text) to service_role;
grant execute on function public.esim_mark_cancel_confirmed(uuid, text) to service_role;
