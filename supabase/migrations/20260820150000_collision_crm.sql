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
