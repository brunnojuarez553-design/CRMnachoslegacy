create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null,
  country text, currency text default 'USD', timezone text default 'America/Argentina/Ushuaia', created_at timestamptz default now()
);
create table if not exists public.memberships (
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'admin', created_at timestamptz default now(), primary key(company_id,user_id)
);
create table if not exists public.channel_connections (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null check(provider in ('whatsapp','instagram')), external_account_id text not null,
  display_name text, status text default 'active', encrypted_credentials jsonb default '{}'::jsonb, created_at timestamptz default now(),
  unique(provider,external_account_id)
);
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  full_name text, phone text, email text, instagram_id text, created_at timestamptz default now()
);
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id), channel text not null, external_contact_id text not null,
  status text default 'open', ai_mode text default 'automatic', assigned_to uuid references auth.users(id), last_message_at timestamptz default now(), created_at timestamptz default now()
);
create index if not exists conversations_company_channel_idx on public.conversations(company_id,channel,last_message_at desc);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade, direction text not null,
  external_id text, body text, message_type text default 'text', raw_payload jsonb default '{}'::jsonb, created_at timestamptz default now()
);
create index if not exists messages_conversation_idx on public.messages(conversation_id,created_at);
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id), conversation_id uuid references public.conversations(id), status text default 'new',
  source text, service_interest text, vehicle_summary text, score int default 0 check(score between 0 and 100), estimated_value numeric(12,2), ai_summary text, created_at timestamptz default now()
);
create table if not exists public.webhook_events (
  id bigint generated always as identity primary key, provider text not null, event_type text, payload jsonb not null,
  processed_at timestamptz, created_at timestamptz default now()
);

alter table public.companies enable row level security;
alter table public.memberships enable row level security;
alter table public.channel_connections enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;

create or replace function public.is_company_member(target_company uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.memberships m where m.company_id=target_company and m.user_id=auth.uid());
$$;

do $$ begin
  create policy "members read companies" on public.companies for select using(public.is_company_member(id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "members read memberships" on public.memberships for select using(user_id=auth.uid() or public.is_company_member(company_id));
exception when duplicate_object then null; end $$;
do $$ declare t text; begin
  foreach t in array array['channel_connections','contacts','conversations','messages','leads'] loop
    execute format('create policy "company members manage %1$s" on public.%1$I for all using (public.is_company_member(company_id)) with check (public.is_company_member(company_id))',t);
  end loop;
exception when duplicate_object then null; end $$;
