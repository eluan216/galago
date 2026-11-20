create table if not exists public.telegram_link_tokens (
  token_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists telegram_link_tokens_expiry_idx
  on public.telegram_link_tokens (expires_at);

alter table public.telegram_link_tokens enable row level security;
revoke all on public.telegram_link_tokens from anon, authenticated;
grant all on public.telegram_link_tokens to service_role;

create table if not exists public.telegram_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telegram_user_id text not null unique,
  chat_id text not null unique,
  username text,
  linked_at timestamptz not null default now()
);

alter table public.telegram_accounts enable row level security;
revoke all on public.telegram_accounts from anon, authenticated;
grant all on public.telegram_accounts to service_role;

create table if not exists public.telegram_chat_sessions (
  telegram_user_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.telegram_chat_sessions enable row level security;
revoke all on public.telegram_chat_sessions from anon, authenticated;
grant all on public.telegram_chat_sessions to service_role;

create or replace function public.link_telegram_account(
  p_token_hash text,
  p_telegram_user_id text,
  p_chat_id text,
  p_username text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token public.telegram_link_tokens%rowtype;
begin
  select * into v_token
  from public.telegram_link_tokens
  where token_hash = p_token_hash
    and expires_at > now()
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'invalid_or_expired');
  end if;

  if exists (
    select 1 from public.telegram_accounts
    where telegram_user_id = p_telegram_user_id
      and user_id <> v_token.user_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'telegram_already_linked');
  end if;

  insert into public.telegram_accounts (user_id, telegram_user_id, chat_id, username)
  values (v_token.user_id, p_telegram_user_id, p_chat_id, p_username)
  on conflict (user_id) do update
    set telegram_user_id = excluded.telegram_user_id,
        chat_id = excluded.chat_id,
        username = excluded.username,
        linked_at = now();

  delete from public.telegram_link_tokens where token_hash = p_token_hash;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.link_telegram_account(text, text, text, text) from public;
grant execute on function public.link_telegram_account(text, text, text, text) to service_role;
