-- Ensure base table exists with all required columns
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  phone_number text,
  city text,
  avatar_url text,
  rank_points integer default 0,
  level_score integer default 0,
  level_tier text default 'Cuivre',
  rank_division text default 'Cuivre',
  rank_sub integer default 1,
  wins integer default 0,
  losses integer default 0,
  reputation integer default 0,
  profile_picture text,
  created_at timestamptz default now()
);

-- Add the missing email column to the base table
alter table public.profiles
add column if not exists email text;

-- Drop the old view safely
drop view if exists public.public_profiles;

-- Recreate the view with email included
create or replace view public.public_profiles as
select
  p.id,
  p.username,
  p.email,
  p.phone_number,
  p.city,
  p.avatar_url,
  p.rank_points,
  p.level_score,
  p.level_tier,
  p.rank_division,
  p.rank_sub,
  p.wins,
  p.losses,
  p.reputation,
  p.profile_picture,
  p.created_at
from public.profiles p;

-- Make sure RLS is active
alter table public.profiles enable row level security;

-- Drop old policies if they exist
drop policy if exists profiles_select_all_auth on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;

-- Create fresh policies
create policy profiles_select_all_auth
on public.profiles
for select
to authenticated
using (true);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid());

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- Grant permissions on the view
grant select on public.public_profiles to authenticated;
grant select on public.public_profiles to anon;
