-- ============================================================
-- LifeLine — Trigger-based webhook (workaround for the Supabase
-- Dashboard "Database Webhooks" UI throwing a schema-does-not-exist
-- error on some projects). This does the exact same job — call your
-- n8n webhook on every INSERT into complaints — using a plain
-- Postgres trigger + the pg_net extension instead of the Dashboard UI.
--
-- Run this in Supabase → SQL Editor → New query.
-- Replace the two YOUR_N8N_WEBHOOK_URL placeholders below with the
-- Production URL you copied from the Webhook node in n8n.
-- ============================================================

-- 1. Enable the extension that lets Postgres make outbound HTTP calls
create extension if not exists pg_net with schema extensions;

-- 2. Function that posts the new row to n8n, shaped exactly like
--    Supabase's own Database Webhook payload (type/table/schema/record)
--    so the existing n8n workflow needs zero changes.
create or replace function public.notify_n8n_new_complaint()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'YOUR_N8N_WEBHOOK_URL',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'complaints',
      'schema', 'public',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

-- 3. Trigger: fires after every insert into complaints
drop trigger if exists trg_notify_n8n_new_complaint on public.complaints;
create trigger trg_notify_n8n_new_complaint
  after insert on public.complaints
  for each row execute function public.notify_n8n_new_complaint();

-- ============================================================
-- Test it: run this, then check the n8n workflow's execution log —
-- a new run should appear within a second or two.
-- ============================================================
-- insert into public.complaints (category, description, location, reported_by, source)
-- values ('Electrical', 'Test row from SQL editor', 'Test location', null, 'student');
