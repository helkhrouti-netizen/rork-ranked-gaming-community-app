-- Run this in Supabase SQL Editor to diagnose database issues
-- This will show you the current state of your tables and help identify problems

-- 1. Check if profiles table exists and what columns it has
SELECT 
  'profiles table columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check if public_profiles view exists
SELECT 
  'public_profiles view definition' as check_type,
  pg_get_viewdef('public.public_profiles', true) as view_definition;

-- 3. Check if the trigger function exists
SELECT 
  'trigger function' as check_type,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- 4. Check if the trigger is active
SELECT 
  'trigger status' as check_type,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';

-- 5. Sample data from profiles (if any)
SELECT 
  'sample profiles' as check_type,
  id,
  email,
  username,
  phone_number,
  level_score,
  level_tier,
  created_at
FROM public.profiles
LIMIT 5;

-- 6. Count of profiles
SELECT 
  'profile count' as check_type,
  count(*) as total_profiles
FROM public.profiles;

-- 7. Check RLS policies on profiles
SELECT 
  'RLS policies' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';
