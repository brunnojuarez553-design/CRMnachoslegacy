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


-- Repair progress SMS tracking
alter table public.contacts add column if not exists preferred_language text default 'en' check (preferred_language in ('en','es'));
alter table public.collision_cases add column if not exists preferred_language text default 'en' check (preferred_language in ('en','es'));
alter table public.repair_updates add column if not exists customer_message text;
alter table public.repair_updates add column if not exists sms_status text default 'not_requested';
alter table public.repair_updates add column if not exists sms_sid text;
alter table public.repair_updates add column if not exists notified_at timestamptz;
create index if not exists repair_updates_case_created_idx on public.repair_updates(case_id,created_at desc);

-- Additive schema; existing customers and cases are preserved.
alter table public.collision_cases add column if not exists submission_id uuid;
create unique index if not exists collision_submission_idx on public.collision_cases(company_id,submission_id) where submission_id is not null;
alter table public.repair_updates add column if not exists request_id uuid;
create unique index if not exists progress_request_idx on public.repair_updates(company_id,request_id) where request_id is not null;
alter table public.webhook_events enable row level security;
revoke all on public.webhook_events from anon, authenticated;
-- Prevent authenticated clients from reading provider credentials.
drop policy if exists "company members manage channel_connections" on public.channel_connections;
revoke all on public.channel_connections from anon, authenticated;
create or replace function public.create_nachos_intake(p_company_id uuid,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare c uuid; v uuid; k uuid; n text; existing record; a jsonb; p jsonb; i integer=0;
begin
  if auth.role() <> 'service_role' then raise exception 'Forbidden'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_company_id::text || (p_payload->>'submissionId'),0));
  select id,case_number into existing from public.collision_cases where company_id=p_company_id and submission_id=(p_payload->>'submissionId')::uuid;
  if found then return jsonb_build_object('caseId',existing.id,'caseNumber',existing.case_number,'duplicate',true); end if;
  -- Serialize identity lookup without requiring destructive deduplication of old contacts.
  perform pg_advisory_xact_lock(hashtextextended(p_company_id::text || coalesce(nullif(p_payload->>'phone',''),p_payload->>'email'),0));
  select id into c from public.contacts where company_id=p_company_id and ((nullif(p_payload->>'phone','') is not null and phone=p_payload->>'phone') or (nullif(p_payload->>'phone','') is null and lower(email)=lower(p_payload->>'email'))) order by created_at limit 1;
  if c is null then
    insert into public.contacts(company_id,full_name,phone,email,preferred_language) values(p_company_id,p_payload->>'name',nullif(p_payload->>'phone',''),nullif(p_payload->>'email',''),p_payload->>'preferredLanguage') returning id into c;
  end if;
  select id into v from public.vehicles where company_id=p_company_id and contact_id=c and coalesce(year,0)=coalesce((p_payload#>>'{vehicle,year}')::int,0) and coalesce(make,'')=coalesce(p_payload#>>'{vehicle,make}','') and coalesce(model,'')=coalesce(nullif(p_payload#>>'{vehicle,model}',''),p_payload#>>'{vehicle,raw}','') order by created_at limit 1;
  if v is null then insert into public.vehicles(company_id,contact_id,year,make,model,vin) values(p_company_id,c,(p_payload#>>'{vehicle,year}')::int,p_payload#>>'{vehicle,make}',coalesce(nullif(p_payload#>>'{vehicle,model}',''),p_payload#>>'{vehicle,raw}'),p_payload#>>'{vehicle,vin}') returning id into v; end if;
  k=gen_random_uuid();n='NL-'||upper(replace(k::text,'-',''));a=coalesce(p_payload->'attribution','{}'::jsonb);
  insert into public.collision_cases(id,company_id,contact_id,vehicle_id,submission_id,case_number,intake_type,status,damage_area,damage_description,drivable,vehicle_location,insurance_company,has_claim,claim_number,source,medium,campaign,landing,referrer,utm_source,utm_medium,utm_campaign,priority,preferred_language)
  values(k,p_company_id,c,v,(p_payload->>'submissionId')::uuid,n,p_payload->>'intakeType','new_intake',p_payload->>'damageArea',p_payload->>'description',(p_payload->>'drivable')::boolean,p_payload->>'vehicleLocation',p_payload->>'insuranceCompany',(p_payload->>'hasClaim')::boolean,p_payload->>'claimNumber',coalesce(a->>'source','website'),coalesce(a->>'medium','form'),a->>'campaign',a->>'landing',a->>'referrer',a->>'utm_source',a->>'utm_medium',a->>'utm_campaign',case when p_payload->>'drivable'='false' then 'high' else 'normal' end,p_payload->>'preferredLanguage');
  for p in select value from jsonb_array_elements(coalesce(p_payload->'photos','[]'::jsonb)) loop
    insert into public.case_photos(company_id,case_id,url,public_id,stage,sort_order) values(p_company_id,k,p->>'url',p->>'publicId','intake',i);i=i+1;
  end loop;
  insert into public.leads(company_id,contact_id,status,source,service_interest,vehicle_summary,score,ai_summary) values(p_company_id,c,'new',coalesce(a->>'source','website'),p_payload->>'intakeType',concat_ws(' ',p_payload#>>'{vehicle,year}',p_payload#>>'{vehicle,make}',coalesce(p_payload#>>'{vehicle,model}',p_payload#>>'{vehicle,raw}')),0,p_payload->>'description');
  insert into public.conversations(company_id,contact_id,channel,external_contact_id,status,preferred_language) values(p_company_id,c,'web',k::text,'open',p_payload->>'preferredLanguage') returning id into v;
  insert into public.messages(company_id,conversation_id,direction,body,raw_payload) values(p_company_id,v,'inbound',concat_ws(E'\n',p_payload->>'name',p_payload->>'description',p_payload->>'insuranceCompany'),jsonb_build_object('case_id',k,'source','web_intake'));
  return jsonb_build_object('caseId',k,'caseNumber',n,'duplicate',false);
end $$;
revoke all on function public.create_nachos_intake(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.create_nachos_intake(uuid,jsonb) to service_role;
create or replace function public.save_nachos_progress(p_company_id uuid,p_case_id uuid,p_request_id uuid,p_stage text,p_message text,p_notify boolean)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare u public.repair_updates; begin
 if not public.is_company_member(p_company_id) then raise exception 'Forbidden'; end if;
 if p_stage not in ('vehicle_received','repair_started','body_work','paint','reassembly','quality_control','ready_for_pickup','delivered') then raise exception 'Invalid stage'; end if;
 perform 1 from public.collision_cases where id=p_case_id and company_id=p_company_id for update;if not found then raise exception 'Case not found'; end if;
 select * into u from public.repair_updates where company_id=p_company_id and request_id=p_request_id;
 if found then return jsonb_build_object('update',to_jsonb(u),'duplicate',true);end if;
 update public.collision_cases set status=p_stage,updated_at=now() where id=p_case_id and company_id=p_company_id;
 insert into public.repair_updates(company_id,case_id,request_id,stage,customer_message,customer_visible,created_by,sms_status) values(p_company_id,p_case_id,p_request_id,p_stage,p_message,p_notify,auth.uid(),case when p_notify then 'pending' else 'not_requested' end) returning * into u;
 return jsonb_build_object('update',to_jsonb(u),'duplicate',false);
end $$;
revoke all on function public.save_nachos_progress(uuid,uuid,uuid,text,text,boolean) from public,anon;
grant execute on function public.save_nachos_progress(uuid,uuid,uuid,text,text,boolean) to authenticated;
create or replace function public.record_nachos_sms(p_company_id uuid,p_update_id uuid,p_sid text,p_status text)
returns void language plpgsql security invoker set search_path=public as $$
declare u public.repair_updates; c public.collision_cases; conversation uuid;
begin
 if not public.is_company_member(p_company_id) then raise exception 'Forbidden';end if;
 select * into u from public.repair_updates where id=p_update_id and company_id=p_company_id for update;if not found then raise exception 'Update missing';end if;
 select * into c from public.collision_cases where id=u.case_id and company_id=p_company_id;
 update public.repair_updates set sms_status=p_status,sms_sid=p_sid,notified_at=now() where id=u.id;
 select id into conversation from public.conversations where company_id=p_company_id and channel='sms' and contact_id=c.contact_id order by created_at limit 1;
 if conversation is null then insert into public.conversations(company_id,contact_id,channel,external_contact_id,status,preferred_language) select p_company_id,c.contact_id,'sms',phone,'open',c.preferred_language from public.contacts where id=c.contact_id and company_id=p_company_id returning id into conversation;end if;
 insert into public.messages(company_id,conversation_id,direction,external_id,body,raw_payload) values(p_company_id,conversation,'outbound',p_sid,u.customer_message,jsonb_build_object('case_id',c.id,'stage',u.stage));
 update public.conversations set last_message_at=now() where id=conversation;
end $$;
revoke all on function public.record_nachos_sms(uuid,uuid,text,text) from public,anon;
grant execute on function public.record_nachos_sms(uuid,uuid,text,text) to authenticated;
-- Company access remains membership based. Do not create memberships for every user.
insert into public.companies(name,slug,country,currency,timezone) values('Nacho''s Legacy Body Shop','nachos-legacy','US','USD','America/New_York') on conflict(slug) do nothing;

create or replace function public.receive_nachos_sms(p_company_id uuid,p_payload jsonb)
returns void language plpgsql security invoker set search_path=public as $$
declare c uuid; v uuid;
begin
 if auth.role()<>'service_role' then raise exception 'Forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_company_id::text||(p_payload->>'MessageSid'),0));
 if exists(select 1 from public.messages where company_id=p_company_id and external_id=p_payload->>'MessageSid') then return;end if;
 perform pg_advisory_xact_lock(hashtextextended(p_company_id::text||(p_payload->>'From'),0));
 select id into c from public.contacts where company_id=p_company_id and phone=p_payload->>'From' order by created_at limit 1;
 if c is null then insert into public.contacts(company_id,phone,full_name) values(p_company_id,p_payload->>'From',p_payload->>'From') returning id into c;end if;
 select id into v from public.conversations where company_id=p_company_id and channel='sms' and external_contact_id=p_payload->>'From' order by created_at limit 1;
 if v is null then insert into public.conversations(company_id,contact_id,channel,external_contact_id,status) values(p_company_id,c,'sms',p_payload->>'From','open') returning id into v;end if;
 insert into public.messages(company_id,conversation_id,direction,external_id,body,message_type,raw_payload) values(p_company_id,v,'inbound',p_payload->>'MessageSid',p_payload->>'Body','text',p_payload);
 update public.conversations set last_message_at=now() where id=v;
end $$;
revoke all on function public.receive_nachos_sms(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.receive_nachos_sms(uuid,jsonb) to service_role;
-- Grant Data API privileges explicitly; RLS still requires company membership.
grant usage on schema public to authenticated,service_role;
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;
grant select on public.companies,public.memberships to authenticated;
grant select,insert,update,delete on public.contacts,public.vehicles,public.collision_cases,public.case_photos,public.repair_updates,public.leads,public.estimates,public.appointments,public.conversations,public.messages,public.phone_call_logs to authenticated;

revoke all on function public.is_company_member(uuid) from public,anon;
grant execute on function public.is_company_member(uuid) to authenticated,service_role;

-- Enforce tenant consistency even when authorized clients write via the Data API.
create or replace function public.validate_nachos_company_links()
returns trigger language plpgsql security invoker set search_path=public as $$
declare payload jsonb; item text; target_table text; target_id uuid;
begin
  payload=to_jsonb(new);
  foreach item in array array['contact_id','vehicle_id','case_id','conversation_id'] loop
    target_id=nullif(payload->>item,'')::uuid;
    if target_id is not null then
      target_table=case item when 'contact_id' then 'contacts' when 'vehicle_id' then 'vehicles' when 'case_id' then 'collision_cases' else 'conversations' end;
      execute format('select id from public.%I where id=$1 and company_id=$2',target_table) into target_id using target_id,new.company_id;
      if target_id is null then raise exception 'Related record is outside this company';end if;
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.validate_nachos_company_links() from public,anon;
do $$ declare t text;begin
 foreach t in array array['vehicles','collision_cases','case_photos','repair_updates','leads','estimates','appointments','conversations','messages','phone_call_logs'] loop
   execute format('drop trigger if exists validate_company_links on public.%I',t);
   execute format('create trigger validate_company_links before insert or update on public.%I for each row execute function public.validate_nachos_company_links()',t);
 end loop;
end $$;
