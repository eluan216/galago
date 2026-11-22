-- Owlet reports "Partial" when it delivers only part of an order and refunds the
-- undelivered part to the Owlet wallet. complete_order() took the whole hold
-- anyway, so the customer paid for quantity that never landed.
--
-- settle_partial_order() charges the delivered quantity at the rate recorded on
-- the order (rounded UP, same rule as hold_order) and returns the remainder of
-- the hold to the wallet. Wallet movements stay integer kobo.

create or replace function public.settle_partial_order(
  p_user_id uuid,
  p_order_id uuid,
  p_delivered_qty integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_wallet wallets%rowtype;
  v_held integer;
  v_rate numeric;
  v_delivered integer;
  v_charge integer;
  v_refund integer;
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

  v_delivered := least(greatest(coalesce(p_delivered_qty, 0), 0), v_order.quantity);
  v_held := coalesce(v_order.held_amount_kobo, v_order.amount_kobo, 0);

  v_rate := coalesce(
    (v_order.metadata->>'rate_kobo')::numeric,
    case
      when v_order.quantity > 0 then v_order.amount_kobo::numeric / v_order.quantity
      else 0
    end
  );

  if v_delivered <= 0 then
    v_charge := 0;
  else
    v_charge := least(
      v_held,
      greatest(1, ceil(v_rate * v_delivered))::integer
    );
  end if;
  v_refund := greatest(0, v_held - v_charge);

  select * into v_wallet
  from wallets
  where user_id = p_user_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'wallet_not_found');
  end if;

  v_new_balance := v_wallet.balance_kobo;
  if v_refund > 0 then
    v_new_balance := v_wallet.balance_kobo + v_refund;
    update wallets
    set balance_kobo = v_new_balance, updated_at = now()
    where id = v_wallet.id;

    insert into ledger_entries (
      wallet_id, user_id, type, amount_kobo, balance_after_kobo,
      reference_type, reference_id, description
    )
    values (
      v_wallet.id, p_user_id, 'refund', v_refund, v_new_balance,
      'order', v_order.id,
      'Partial refund for order ' || left(v_order.id::text, 8) ||
        ' (' || v_delivered || ' of ' || v_order.quantity || ' delivered)'
    );
  end if;

  insert into ledger_entries (
    wallet_id, user_id, type, amount_kobo, balance_after_kobo,
    reference_type, reference_id, description
  )
  values (
    v_wallet.id, p_user_id, 'settle', 0, v_new_balance,
    'order', v_order.id, 'Settled order ' || left(v_order.id::text, 8)
  );

  update orders
  set status = 'completed',
      delivered_qty = v_delivered,
      held_amount_kobo = 0,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'partial', v_delivered < v_order.quantity,
        'delivered_qty', v_delivered,
        'settled_kobo', v_charge,
        'refunded_kobo', v_refund
      ),
      updated_at = now()
  where id = v_order.id;

  insert into order_events (order_id, status, note)
  values (
    v_order.id,
    'completed',
    'Partial delivery: ' || v_delivered || ' of ' || v_order.quantity ||
      ' delivered - ' || v_charge || ' kobo charged, ' || v_refund ||
      ' kobo returned'
  );

  return jsonb_build_object(
    'ok', true,
    'status', 'completed',
    'delivered_qty', v_delivered,
    'ordered_qty', v_order.quantity,
    'charged_kobo', v_charge,
    'refunded_kobo', v_refund,
    'balance_after_kobo', v_new_balance
  );
end;
$$;

revoke all on function public.settle_partial_order(uuid, uuid, integer) from public;
grant execute on function public.settle_partial_order(uuid, uuid, integer) to service_role;
