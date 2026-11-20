create or replace function public.hold_order(
  p_user_id uuid,
  p_offer_id uuid,
  p_quantity integer,
  p_target_link text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer offers%rowtype;
  v_wallet wallets%rowtype;
  v_order orders%rowtype;
  v_existing orders%rowtype;
  v_amount integer;
  v_new_balance integer;
begin
  if p_quantity < 1 or p_idempotency_key is null or p_idempotency_key = '' then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  select * into v_existing
  from orders
  where idempotency_key = p_idempotency_key
    and user_id = p_user_id
  limit 1;
  if found then
    return jsonb_build_object('ok', true, 'order_id', v_existing.id, 'status', v_existing.status);
  end if;

  select * into v_offer
  from offers
  where id = p_offer_id and is_active = true
  limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'offer_not_found');
  end if;
  if p_quantity < v_offer.min_qty or p_quantity > v_offer.max_qty then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_quantity',
      'min_qty', v_offer.min_qty,
      'max_qty', v_offer.max_qty
    );
  end if;

  v_amount := v_offer.rate_kobo * p_quantity;
  select * into v_wallet
  from wallets
  where user_id = p_user_id
  for update;
  if not found then
    insert into wallets (user_id, balance_kobo, currency)
    values (p_user_id, 0, 'NGN')
    returning * into v_wallet;
  end if;
  if v_wallet.balance_kobo < v_amount then
    return jsonb_build_object(
      'ok', false,
      'code', 'insufficient_balance',
      'need_kobo', v_amount,
      'balance_kobo', v_wallet.balance_kobo
    );
  end if;

  v_new_balance := v_wallet.balance_kobo - v_amount;
  update wallets
  set balance_kobo = v_new_balance, updated_at = now()
  where id = v_wallet.id;

  insert into orders (
    user_id, offer_id, quantity, target_link, status, amount_kobo,
    held_amount_kobo, idempotency_key, metadata
  )
  values (
    p_user_id, p_offer_id, p_quantity, p_target_link, 'held', v_amount,
    v_amount, p_idempotency_key,
    jsonb_build_object('rate_kobo', v_offer.rate_kobo)
  )
  returning * into v_order;

  insert into ledger_entries (
    wallet_id, user_id, type, amount_kobo, balance_after_kobo,
    reference_type, reference_id, description
  )
  values (
    v_wallet.id, p_user_id, 'hold', -v_amount, v_new_balance,
    'order', v_order.id, 'Hold for order ' || left(v_order.id::text, 8)
  );

  insert into order_events (order_id, status, note)
  values (v_order.id, 'held', 'Funds held. Awaiting delivery / mark complete.');

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order.id,
    'status', v_order.status,
    'amount_kobo', v_amount,
    'balance_after_kobo', v_new_balance
  );
end;
$$;

create or replace function public.complete_order(p_user_id uuid, p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_wallet wallets%rowtype;
begin
  select * into v_order
  from orders
  where id = p_order_id and user_id = p_user_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'order_not_found');
  end if;
  if v_order.status not in ('held', 'processing', 'partial') then
    return jsonb_build_object('ok', true, 'status', v_order.status, 'already_processed', true);
  end if;

  update orders
  set status = 'completed', delivered_qty = quantity, updated_at = now()
  where id = v_order.id;

  select * into v_wallet
  from wallets
  where user_id = p_user_id
  for update;
  if found then
    insert into ledger_entries (
      wallet_id, user_id, type, amount_kobo, balance_after_kobo,
      reference_type, reference_id, description
    )
    values (
      v_wallet.id, p_user_id, 'settle', 0, v_wallet.balance_kobo,
      'order', v_order.id, 'Settled order ' || left(v_order.id::text, 8)
    );
  end if;

  insert into order_events (order_id, status, note)
  values (v_order.id, 'completed', 'Order marked completed (settle)');

  return jsonb_build_object('ok', true, 'status', 'completed');
end;
$$;

create or replace function public.release_order(p_user_id uuid, p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_wallet wallets%rowtype;
  v_release integer;
  v_new_balance integer;
begin
  select * into v_order
  from orders
  where id = p_order_id and user_id = p_user_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'order_not_found');
  end if;
  if v_order.status not in ('held', 'processing', 'partial') then
    return jsonb_build_object('ok', true, 'status', v_order.status, 'already_processed', true);
  end if;

  v_release := coalesce(v_order.held_amount_kobo, v_order.amount_kobo, 0);
  select * into v_wallet
  from wallets
  where user_id = p_user_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'wallet_not_found');
  end if;

  v_new_balance := v_wallet.balance_kobo + v_release;
  update wallets
  set balance_kobo = v_new_balance, updated_at = now()
  where id = v_wallet.id;

  update orders
  set status = 'failed', held_amount_kobo = 0, updated_at = now()
  where id = v_order.id;

  insert into ledger_entries (
    wallet_id, user_id, type, amount_kobo, balance_after_kobo,
    reference_type, reference_id, description
  )
  values (
    v_wallet.id, p_user_id, 'release', v_release, v_new_balance,
    'order', v_order.id, 'Released hold for order ' || left(v_order.id::text, 8)
  );

  insert into order_events (order_id, status, note)
  values (v_order.id, 'failed', 'Hold released - funds returned to wallet');

  return jsonb_build_object(
    'ok', true,
    'status', 'failed',
    'released_kobo', v_release,
    'balance_after_kobo', v_new_balance
  );
end;
$$;

create or replace function public.credit_wallet(
  p_user_id uuid,
  p_amount_kobo integer,
  p_type text,
  p_reference_type text,
  p_reference_id text,
  p_description text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet wallets%rowtype;
  v_existing ledger_entries%rowtype;
  v_new_balance integer;
begin
  if p_amount_kobo <= 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_amount');
  end if;

  select * into v_existing
  from ledger_entries
  where reference_type = p_reference_type
    and (
      (p_reference_id is not null and description = p_description)
      or (p_reference_type = 'demo_credit' and user_id = p_user_id)
    )
  limit 1;
  if found then
    return jsonb_build_object('ok', true, 'already_processed', true);
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

  v_new_balance := v_wallet.balance_kobo + p_amount_kobo;
  update wallets
  set balance_kobo = v_new_balance, updated_at = now()
  where id = v_wallet.id;

  insert into ledger_entries (
    wallet_id, user_id, type, amount_kobo, balance_after_kobo,
    reference_type, reference_id, description, metadata
  )
  values (
    v_wallet.id, p_user_id, p_type, p_amount_kobo, v_new_balance,
    p_reference_type, nullif(p_reference_id, '')::uuid, p_description, p_metadata
  );

  return jsonb_build_object(
    'ok', true,
    'credited_kobo', p_amount_kobo,
    'balance_kobo', v_new_balance
  );
end;
$$;

revoke all on function public.hold_order(uuid, uuid, integer, text, text) from public;
revoke all on function public.complete_order(uuid, uuid) from public;
revoke all on function public.release_order(uuid, uuid) from public;
revoke all on function public.credit_wallet(uuid, integer, text, text, text, text, jsonb) from public;
grant execute on function public.hold_order(uuid, uuid, integer, text, text) to service_role;
grant execute on function public.complete_order(uuid, uuid) to service_role;
grant execute on function public.release_order(uuid, uuid) to service_role;
grant execute on function public.credit_wallet(uuid, integer, text, text, text, text, jsonb) to service_role;
