create table if not exists public.vtpass_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null unique,
  idempotency_key uuid not null,
  category text not null,
  service_id text not null,
  service_name text not null,
  variation_code text,
  product_name text not null,
  customer_reference text not null,
  phone text not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'failed')),
  provider_transaction_id text,
  purchased_code text,
  provider_code text,
  response_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vtpass_transactions_user_created_idx
  on public.vtpass_transactions (user_id, created_at desc);
create unique index if not exists vtpass_transactions_user_idempotency_idx
  on public.vtpass_transactions (user_id, idempotency_key);

alter table public.vtpass_transactions enable row level security;

drop policy if exists "Users can view their VTpass transactions"
  on public.vtpass_transactions;
create policy "Users can view their VTpass transactions"
  on public.vtpass_transactions
  for select
  using (auth.uid() = user_id);

grant select on public.vtpass_transactions to authenticated;
grant all on public.vtpass_transactions to service_role;

create or replace function public.vtpass_start_purchase(
  p_user_id uuid,
  p_idempotency_key uuid,
  p_request_id text,
  p_category text,
  p_service_id text,
  p_service_name text,
  p_variation_code text,
  p_product_name text,
  p_customer_reference text,
  p_phone text,
  p_amount_kobo bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing vtpass_transactions%rowtype;
  v_wallet wallets%rowtype;
  v_transaction vtpass_transactions%rowtype;
  v_new_balance bigint;
begin
  if p_idempotency_key is null
    or p_amount_kobo <= 0
    or p_request_id !~ '^[0-9]{12}[A-Za-z0-9_-]{1,}$'
  then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || p_idempotency_key::text, 0)
  );

  select * into v_existing
  from vtpass_transactions
  where user_id = p_user_id and idempotency_key = p_idempotency_key
  limit 1;
  if found then
    return jsonb_build_object(
      'ok', true,
      'created', false,
      'transaction_id', v_existing.id,
      'request_id', v_existing.request_id,
      'status', v_existing.status,
      'amount_kobo', v_existing.amount_kobo,
      'purchased_code', v_existing.purchased_code
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
  from vtpass_transactions
  where user_id = p_user_id
    and category = p_category
    and service_id = p_service_id
    and variation_code is not distinct from p_variation_code
    and customer_reference = p_customer_reference
    and phone = p_phone
    and amount_kobo = p_amount_kobo
    and status = 'pending'
  order by created_at desc
  limit 1;
  if found then
    return jsonb_build_object(
      'ok', true,
      'created', false,
      'transaction_id', v_existing.id,
      'request_id', v_existing.request_id,
      'status', v_existing.status,
      'amount_kobo', v_existing.amount_kobo,
      'purchased_code', v_existing.purchased_code
    );
  end if;

  if v_wallet.balance_kobo < p_amount_kobo then
    return jsonb_build_object(
      'ok', false,
      'code', 'insufficient_balance',
      'balance_kobo', v_wallet.balance_kobo
    );
  end if;

  v_new_balance := v_wallet.balance_kobo - p_amount_kobo;
  update wallets
  set balance_kobo = v_new_balance, updated_at = now()
  where id = v_wallet.id;

  insert into vtpass_transactions (
    user_id, request_id, idempotency_key, category, service_id, service_name,
    variation_code, product_name, customer_reference, phone, amount_kobo
  )
  values (
    p_user_id, p_request_id, p_idempotency_key, p_category, p_service_id, p_service_name,
    p_variation_code, p_product_name, p_customer_reference, p_phone, p_amount_kobo
  )
  returning * into v_transaction;

  insert into ledger_entries (
    wallet_id, user_id, type, amount_kobo, balance_after_kobo,
    reference_type, reference_id, description, metadata
  )
  values (
    v_wallet.id, p_user_id, 'vtpass_purchase', -p_amount_kobo, v_new_balance,
    'vtpass', v_transaction.id, 'VTpass purchase: ' || p_product_name,
    jsonb_build_object('request_id', p_request_id, 'service_id', p_service_id)
  );

  return jsonb_build_object(
    'ok', true,
    'created', true,
    'transaction_id', v_transaction.id,
    'request_id', v_transaction.request_id,
    'status', v_transaction.status,
    'amount_kobo', v_transaction.amount_kobo,
    'balance_after_kobo', v_new_balance
  );
end;
$$;

create or replace function public.vtpass_resolve_purchase(
  p_user_id uuid,
  p_request_id text,
  p_status text,
  p_provider_code text default null,
  p_response_description text default null,
  p_provider_transaction_id text default null,
  p_purchased_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction vtpass_transactions%rowtype;
  v_wallet wallets%rowtype;
  v_new_balance bigint;
begin
  if p_status not in ('pending', 'delivered', 'failed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;

  select * into v_transaction
  from vtpass_transactions
  where request_id = p_request_id and user_id = p_user_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_transaction.status <> 'pending' then
    return jsonb_build_object(
      'ok', true,
      'status', v_transaction.status,
      'already_resolved', true,
      'purchased_code', v_transaction.purchased_code
    );
  end if;

  update vtpass_transactions
  set status = p_status,
      provider_code = coalesce(p_provider_code, provider_code),
      response_description = coalesce(p_response_description, response_description),
      provider_transaction_id = coalesce(p_provider_transaction_id, provider_transaction_id),
      purchased_code = coalesce(p_purchased_code, purchased_code),
      updated_at = now()
  where id = v_transaction.id;

  if p_status = 'failed' then
    select * into v_wallet
    from wallets
    where user_id = p_user_id
    for update;
    if not found then
      raise exception 'Wallet missing while refunding VTpass transaction %', v_transaction.id;
    end if;

    v_new_balance := v_wallet.balance_kobo + v_transaction.amount_kobo;
    update wallets
    set balance_kobo = v_new_balance, updated_at = now()
    where id = v_wallet.id;

    insert into ledger_entries (
      wallet_id, user_id, type, amount_kobo, balance_after_kobo,
      reference_type, reference_id, description, metadata
    )
    values (
      v_wallet.id, p_user_id, 'vtpass_refund', v_transaction.amount_kobo, v_new_balance,
      'vtpass', v_transaction.id, 'Refund for failed VTpass purchase',
      jsonb_build_object('request_id', p_request_id, 'provider_code', p_provider_code)
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'status', p_status,
    'purchased_code', p_purchased_code,
    'balance_after_kobo', case when p_status = 'failed' then v_new_balance else null end
  );
end;
$$;

revoke all on function public.vtpass_start_purchase(
  uuid, uuid, text, text, text, text, text, text, text, text, bigint
) from public;
revoke all on function public.vtpass_resolve_purchase(
  uuid, text, text, text, text, text, text
) from public;

grant execute on function public.vtpass_start_purchase(
  uuid, uuid, text, text, text, text, text, text, text, text, bigint
) to service_role;
grant execute on function public.vtpass_resolve_purchase(
  uuid, text, text, text, text, text, text
) to service_role;
