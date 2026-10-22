-- Older migrations did not include the bilingual conversation fields.
alter table public.conversations add column if not exists preferred_language text default 'en' check (preferred_language in ('en','es'));
alter table public.messages add column if not exists detected_language text;
alter table public.messages add column if not exists translations jsonb default '{}'::jsonb;
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
