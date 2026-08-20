-- Nacho's Legacy: US-first communication model
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
  create policy "company members manage phone_call_logs" on public.phone_call_logs
  for all using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));
exception when duplicate_object then null; end $$;
create index if not exists phone_call_logs_company_idx on public.phone_call_logs(company_id,created_at desc);
