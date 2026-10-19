-- Run this entire script in Supabase SQL Editor.
-- Two tables deliberately separate private submissions from public map listings.
-- Public users can insert pending submissions, but cannot read or approve them.
-- Moderators review submissions in the Supabase dashboard and manually create
-- a sanitized public_reports row after approval.

create table if not exists public.report_submissions (
  id uuid primary key default gen_random_uuid(),
  venue_name text not null check (char_length(trim(venue_name)) between 1 and 120),
  incident_month date not null,
  latitude double precision not null check (latitude between 40.45 and 40.95),
  longitude double precision not null check (longitude between -74.30 and -73.65),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'rejected', 'reviewed')),
  created_at timestamptz not null default now()
);

create table if not exists public.public_reports (
  id uuid primary key default gen_random_uuid(),
  venue_label text not null check (char_length(trim(venue_label)) between 1 and 120),
  incident_month date not null,
  latitude double precision not null check (latitude between 40.45 and 40.95),
  longitude double precision not null check (longitude between -74.30 and -73.65),
  summary text not null default 'Community-submitted suspected incident; not independently verified.'
    check (char_length(summary) <= 240),
  created_at timestamptz not null default now()
);

alter table public.report_submissions enable row level security;
alter table public.public_reports enable row level security;

-- Remove default client permissions first, then grant only required operations.
revoke all on table public.report_submissions from anon, authenticated;
revoke all on table public.public_reports from anon, authenticated;

grant insert on table public.report_submissions to anon;
grant select on table public.public_reports to anon, authenticated;

drop policy if exists "Anyone may submit a pending report" on public.report_submissions;
create policy "Anyone may submit a pending report"
on public.report_submissions
for insert
to anon
with check (status = 'pending');

drop policy if exists "Anyone can read public reports" on public.public_reports;
create policy "Anyone can read public reports"
on public.public_reports
for select
to anon, authenticated
using (true);

-- Intentionally no client SELECT, UPDATE, or DELETE policies on report_submissions.
-- No client INSERT/UPDATE/DELETE grants on public_reports.
-- Moderation happens in the trusted Supabase dashboard, not this website.

-- Optional hardening: keep direct client writes to the public feed impossible.
-- Do not create a public insert/update/delete policy for public_reports.
