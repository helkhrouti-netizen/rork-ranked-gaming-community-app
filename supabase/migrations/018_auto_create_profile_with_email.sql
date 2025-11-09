-- Function to auto-create profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do update
  set email = excluded.email;
  
  return new;
end;
$$;

-- Drop the trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger to run after user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
