-- Ensure profiles table has all required columns
alter table public.profiles
add column if not exists email text,
add column if not exists username text,
add column if not exists phone_number text,
add column if not exists city text,
add column if not exists avatar_url text,
add column if not exists profile_picture text,
add column if not exists rank_rp integer default 0,
add column if not exists level_score integer default 0,
add column if not exists rank_points integer default 0,
add column if not exists level_tier text default 'Cuivre',
add column if not exists rank_division text default 'Cuivre',
add column if not exists rank_sub integer default 1,
add column if not exists wins integer default 0,
add column if not exists losses integer default 0,
add column if not exists reputation numeric default 5.0,
add column if not exists games_played integer default 0,
add column if not exists created_at timestamptz default now();

-- Drop and recreate the public_profiles view with all fields
drop view if exists public.public_profiles cascade;

create or replace view public.public_profiles as
select
  p.id,
  p.username,
  p.email,
  p.phone_number,
  p.city,
  p.avatar_url,
  p.profile_picture,
  p.rank_rp,
  p.level_score,
  p.rank_points,
  p.level_tier,
  p.rank_division,
  p.rank_sub,
  p.wins,
  p.losses,
  p.reputation,
  p.games_played,
  p.created_at
from public.profiles p;

-- Ensure RLS is enabled
alter table public.profiles enable row level security;

-- Drop old policies
drop policy if exists profiles_select_all_auth on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;

-- Create RLS policies that allow authenticated users to read all profiles
create policy profiles_select_all_auth
on public.profiles
for select
to authenticated
using (true);

-- Allow users to update their own profile
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid());

-- Allow users to insert their own profile
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- Recreate the auto-profile creation trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, 
    email, 
    username,
    level_score,
    rank_points,
    level_tier,
    rank_division,
    rank_sub,
    wins,
    losses,
    reputation,
    games_played,
    created_at
  )
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data->>'username', 'User'),
    0,
    0,
    'Cuivre',
    'Cuivre',
    1,
    0,
    0,
    5.0,
    0,
    now()
  )
  on conflict (id) do update
  set 
    email = excluded.email,
    username = coalesce(excluded.username, profiles.username);
  
  return new;
end;
$$;

-- Drop and recreate trigger
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grant permissions
grant select on public.public_profiles to authenticated;
grant all on public.profiles to authenticated;
