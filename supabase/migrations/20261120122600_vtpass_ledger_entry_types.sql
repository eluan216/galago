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
        'vtpass_refund'
      ]::text[]
    )
  );
