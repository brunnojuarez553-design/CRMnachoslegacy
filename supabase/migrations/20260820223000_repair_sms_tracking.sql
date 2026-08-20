-- Repair progress + SMS tracking for Nacho's Legacy
alter table public.contacts add column if not exists preferred_language text default 'en' check (preferred_language in ('en','es'));
alter table public.collision_cases add column if not exists preferred_language text default 'en' check (preferred_language in ('en','es'));
alter table public.repair_updates add column if not exists customer_message text;
alter table public.repair_updates add column if not exists sms_status text default 'not_requested';
alter table public.repair_updates add column if not exists sms_sid text;
alter table public.repair_updates add column if not exists notified_at timestamptz;
create index if not exists repair_updates_case_created_idx on public.repair_updates(case_id,created_at desc);
