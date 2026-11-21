-- Offers are priced per unit in kobo. Cheap provider services cost well under
-- one kobo per unit (Owlet's TikTok views are ₦6.05 per 1,000 = 0.6655 kobo per
-- unit), so the integer column forced those rates up to 1 kobo, i.e. a 65%
-- markup instead of the intended 10%.
--
-- rate_kobo now keeps the fractional per-unit rate, and hold_order() rounds the
-- order total UP to a whole kobo. Wallet movements stay integer kobo, and the
-- rounding can only ever favour Galago, never the customer.

alter table public.offers
  alter column rate_kobo type numeric(14, 4) using rate_kobo::numeric(14, 4);

alter table public.offers
  drop constraint if exists offers_rate_kobo_positive;

alter table public.offers
  add constraint offers_rate_kobo_positive check (rate_kobo > 0);

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

  -- Fractional per-unit rate: round the total up so a sub-kobo rate can never
  -- round in the customer's favour.
  v_amount := greatest(1, ceil(v_offer.rate_kobo * p_quantity))::integer;
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

revoke all on function public.hold_order(uuid, uuid, integer, text, text) from public;
grant execute on function public.hold_order(uuid, uuid, integer, text, text) to service_role;
