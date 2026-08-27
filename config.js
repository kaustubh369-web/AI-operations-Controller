// ============================================================
// LifeLine — Supabase config
// Fill these in from: Supabase Dashboard → Project Settings → API
// SUPABASE_ANON_KEY is safe to expose in the browser (RLS protects the data).
// NEVER put the service_role key in this file.
// ============================================================
const SUPABASE_URL = "https://ksreqrxokmhrhcryflme.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcmVxcnhva21ocmhjcnlmbG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODA0OTMsImV4cCI6MjEwMzE1NjQ5M30.fpB8Y8AZqKEQMa4Hd2WjfZnDMHbE4GO7sP5SbXrKHjw";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
