-- Fix the trigger function syntax and ensure proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  temp_username TEXT;
BEGIN
  -- Generate a temporary unique username using user ID
  temp_username := 'user_' || substring(NEW.id::text from 1 for 8);
  
  -- Insert the new profile
  INSERT INTO public.profiles (
    id, 
    username, 
    email, 
    level_score, 
    level_tier, 
    rank_division,
    rank_sub,
    rank_points,
    phone_number,
    wins,
    losses,
    reputation,
    games_played,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', temp_username),
    NEW.email,
    0,
    'Cuivre',
    'Cuivre',
    1,
    0,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NULL),
    0,
    0,
    5.0,
    0,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, profiles.username),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it so signup fails properly with error message
    RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_all_auth ON public.profiles;

-- Allow users to insert their own profile (important for manual creates)
CREATE POLICY profiles_insert_own
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow authenticated users to read all profiles
CREATE POLICY profiles_select_all_auth
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Ensure the profiles table has RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
