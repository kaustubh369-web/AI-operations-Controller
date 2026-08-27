-- ============================================================
-- LifeLine — Supabase Schema (Phase 1 + Phase 2)
-- Run this whole file once in Supabase → SQL Editor → New query
-- ============================================================

-- ---------- 1. PROFILES (extends Supabase Auth users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  room_number text not null,
  floor text,
  phone text,
  role text not null default 'student' check (role in ('student', 'staff', 'warden')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can see + edit only their own profile...
create policy "profiles: self select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: self insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ...but staff/warden can see everyone (needed for the admin view)
create policy "profiles: staff read all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('staff', 'warden')
    )
  );

-- ---------- 2. COMPLAINTS ----------
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Electrical', 'Plumbing', 'Civil-Structural', 'Furniture', 'Network', 'Other')),
  description text not null,
  photo_url text,
  location text not null,             -- e.g. "B-Wing, 2nd Floor, Room 214"
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  priority text default 'unassigned' check (priority in ('unassigned', 'low', 'medium', 'high', 'safety_critical')),
  ai_notes text,                       -- short reasoning Claude returns during triage
  source text not null default 'student' check (source in ('student', 'auto_monitor')),
  reported_by uuid references public.profiles (id),
  assigned_to text,                    -- free text: which staff group/person it was routed to
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  last_reminder_at timestamptz,
  escalated boolean not null default false
);

alter table public.complaints enable row level security;

-- Students can insert their own complaints
create policy "complaints: student insert own"
  on public.complaints for insert
  with check (auth.uid() = reported_by);

-- Students can see only their own complaints
create policy "complaints: student select own"
  on public.complaints for select
  using (auth.uid() = reported_by);

-- Staff/warden can see + update everything
create policy "complaints: staff select all"
  on public.complaints for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('staff', 'warden')
    )
  );

create policy "complaints: staff update all"
  on public.complaints for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('staff', 'warden')
    )
  );

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_complaints_touch on public.complaints;
create trigger trg_complaints_touch
  before update on public.complaints
  for each row execute function public.touch_updated_at();

-- ---------- 3. STORAGE (complaint photos) ----------
insert into storage.buckets (id, name, public)
values ('complaint-photos', 'complaint-photos', true)
on conflict (id) do nothing;

create policy "complaint-photos: anyone signed in can upload"
  on storage.objects for insert
  with check (bucket_id = 'complaint-photos' and auth.role() = 'authenticated');

create policy "complaint-photos: public read"
  on storage.objects for select
  using (bucket_id = 'complaint-photos');

-- ---------- 4. SERVICE ROLE ACCESS FOR n8n ----------
-- n8n calls Supabase using the SERVICE_ROLE key (Settings → API), which
-- bypasses RLS entirely — so no extra policy is needed for the workflows.
-- Never put the service_role key in the website's front-end code.

-- ---------- 5. Helpful indexes ----------
create index if not exists idx_complaints_status on public.complaints (status);
create index if not exists idx_complaints_priority on public.complaints (priority);
create index if not exists idx_complaints_created_at on public.complaints (created_at);

-- ---------- 6. Realtime (optional, lets dashboards update live) ----------
alter publication supabase_realtime add table public.complaints;
