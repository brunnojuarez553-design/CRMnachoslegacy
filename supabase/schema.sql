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
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  year int,
  make text,
  model text,
  vin text,
  plate text,
  mileage int,
  color text,
  created_at timestamptz default now()
);

create table if not exists public.collision_cases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  case_number text,
  intake_type text not null default 'collision',
  status text not null default 'new_intake',
  damage_area text,
  damage_description text,
  drivable boolean,
  vehicle_location text,
  insurance_company text,
  has_claim boolean,
  claim_number text,
  adjuster_name text,
  adjuster_phone text,
  estimated_value numeric(12,2),
  source text,
  medium text,
  campaign text,
  landing text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ai_summary text,
  priority text default 'normal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.case_photos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  case_id uuid not null references public.collision_cases(id) on delete cascade,
  url text not null,
  public_id text,
  stage text default 'intake',
  sort_order int default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  case_id uuid references public.collision_cases(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  estimate_number text,
  status text default 'draft',
  subtotal numeric(12,2) default 0,
  tax numeric(12,2) default 0,
  total numeric(12,2) default 0,
  valid_until date,
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.repair_updates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  case_id uuid not null references public.collision_cases(id) on delete cascade,
  stage text not null,
  note text,
  customer_visible boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  case_id uuid references public.collision_cases(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  title text not null,
  appointment_type text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text default 'scheduled',
  created_at timestamptz default now()
);

create index if not exists collision_cases_company_status_idx on public.collision_cases(company_id,status,created_at desc);
create index if not exists vehicles_company_contact_idx on public.vehicles(company_id,contact_id);
create index if not exists case_photos_case_idx on public.case_photos(case_id,sort_order);
create index if not exists estimates_company_status_idx on public.estimates(company_id,status,created_at desc);
create index if not exists appointments_company_time_idx on public.appointments(company_id,starts_at);

alter table public.vehicles enable row level security;
alter table public.collision_cases enable row level security;
alter table public.case_photos enable row level security;
alter table public.estimates enable row level security;
alter table public.repair_updates enable row level security;
alter table public.appointments enable row level security;

do $$ declare t text; begin
  foreach t in array array['vehicles','collision_cases','case_photos','estimates','repair_updates','appointments'] loop
    execute format('create policy "company members manage %1$s" on public.%1$I for all using (public.is_company_member(company_id)) with check (public.is_company_member(company_id))',t);
  end loop;
exception when duplicate_object then null; end $$;

-- Bilingual communication support (safe to run on existing projects)
alter table public.contacts add column if not exists preferred_language text default 'en' check (preferred_language in ('en','es'));
alter table public.conversations add column if not exists preferred_language text default 'en' check (preferred_language in ('en','es'));
alter table public.messages add column if not exists detected_language text;
alter table public.messages add column if not exists translations jsonb default '{}'::jsonb;
alter table public.collision_cases add column if not exists preferred_language text default 'en' check (preferred_language in ('en','es'));

-- Nacho's Legacy US communication channels
alter table public.channel_connections drop constraint if exists channel_connections_provider_check;
alter table public.channel_connections add constraint channel_connections_provider_check check(provider in ('sms','instagram','whatsapp'));
alter table public.companies alter column timezone set default 'America/New_York';
update public.companies set timezone='America/New_York', country='US', currency='USD' where slug='nachos-legacy';

create table if not exists public.phone_call_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  case_id uuid references public.collision_cases(id) on delete set null,
  direction text not null default 'inbound',
  phone text,
  duration_seconds int,
  summary text,
  outcome text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table public.phone_call_logs enable row level security;
do $$ begin
  create policy "company members manage phone_call_logs" on public.phone_call_logs for all using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
exception when duplicate_object then null; end $$;
create index if not exists phone_call_logs_company_idx on public.phone_call_logs(company_id,created_at desc);
