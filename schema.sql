-- ============================================================================
-- LifeLine by Cognora — Supabase Schema
-- Self-Healing AI Operations Controller for Campus Digital & Physical
-- Infrastructure (SOAIDEATHON-S3)
--
-- HOW TO RUN:
-- 1. Open your Supabase project -> SQL Editor -> New query.
-- 2. Paste this whole file and click "Run".
-- 3. Then go to Storage and confirm the two buckets were created
--    (boarding-passes, problem-images). If not, create them manually
--    as PRIVATE buckets with the same names.
-- 4. Go to Authentication -> Providers -> Email and turn OFF
--    "Confirm email" so students can log in immediately after signup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES  (one row per student/staff, linked to auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text not null,
  bh_number text not null,           -- Boys' Hostel number, e.g. "BH-3"
  room_number text not null,
  email text not null,
  boarding_pass_url text,            -- path in the boarding-passes bucket
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Students can read & update their own profile.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- A user can create their own profile row right after signup.
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Admins (wardens/staff) can read every profile (needed for the dashboard).
--
-- NOTE: this MUST use the is_admin() helper below rather than an inline
-- `exists (select 1 from public.profiles ...)` subquery. A policy on
-- `profiles` that queries `profiles` directly re-triggers its own
-- evaluation and Postgres throws "infinite recursion detected in policy
-- for relation profiles". Routing the check through a SECURITY DEFINER
-- function breaks the recursion because the function runs with elevated
-- privileges and bypasses RLS for its internal lookup.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. REPORTS  (student-submitted problems)
-- ----------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,            -- Electrical, Plumbing, Network/WiFi, Fire/Safety, Structural, Sanitation, Security, Other
  description text not null,
  location text not null,            -- e.g. "BH-3, Floor 2, Room 214, near washroom"
  image_url text,                    -- path in the problem-images bucket

  status text not null default 'pending'
    check (status in ('pending', 'in_review', 'approved', 'rejected')),

  risk_level text check (risk_level in ('low', 'medium', 'high')),
  ai_solution text,                  -- recommended recovery playbook
  ai_reasoning text,                 -- why this happened / why this risk level
  sandbox_log jsonb default '[]'::jsonb,   -- array of simulated sandbox steps
  audit_trail jsonb default '[]'::jsonb,   -- array of {action, actor, timestamp}

  approved_by uuid references public.profiles (id),
  approved_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Students can insert their own reports.
create policy "reports_insert_own"
  on public.reports for insert
  with check (auth.uid() = student_id);

-- Students can view their own reports.
create policy "reports_select_own"
  on public.reports for select
  using (auth.uid() = student_id);

-- Students can update their own reports (used right after insert, to attach
-- the sandbox simulation + AI analysis results computed in the browser).
create policy "reports_update_own"
  on public.reports for update
  using (auth.uid() = student_id);

-- Admins can see and act on every report.
create policy "reports_select_admin"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "reports_update_admin"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_reports_updated_at on public.reports;
create trigger trg_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. STORAGE BUCKETS
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('boarding-passes', 'boarding-passes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('problem-images', 'problem-images', false)
on conflict (id) do nothing;

-- Files are uploaded to a path like "<user_id>/filename.jpg" — policies below
-- check that the first path segment matches the uploader's own auth.uid().

create policy "boarding_pass_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'boarding-passes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "boarding_pass_select_own_or_admin"
  on storage.objects for select
  using (
    bucket_id = 'boarding-passes'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    )
  );

create policy "problem_image_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'problem-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "problem_image_select_own_or_admin"
  on storage.objects for select
  using (
    bucket_id = 'problem-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 4. RATE LIMITING — max 1 report submission per student per hour
-- ----------------------------------------------------------------------------
-- Runs as a BEFORE INSERT trigger, so it's enforced by Postgres itself no
-- matter which client calls it — not something that can be bypassed by
-- editing frontend code.
create or replace function public.check_report_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.reports
  where student_id = new.student_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 1 then
    raise exception 'RATE_LIMIT: You can submit at most 1 report per hour. Please wait before submitting another.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_report_rate_limit on public.reports;
create trigger trg_report_rate_limit
  before insert on public.reports
  for each row execute function public.check_report_rate_limit();

-- ----------------------------------------------------------------------------
-- 5. MAKE SOMEONE AN ADMIN (run manually, after they've signed up once)
-- ----------------------------------------------------------------------------
-- update public.profiles set role = 'admin' where email = 'warden@example.com';
