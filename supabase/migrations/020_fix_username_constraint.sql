-- Fix username constraint to allow NULL and non-unique usernames during signup
-- Users can set their username during onboarding

-- Drop the unique constraint on username
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Make username nullable
ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  temp_username TEXT;
BEGIN
  -- Generate a temporary unique username using user ID
  temp_username := 'user_' || substring(NEW.id::text from 1 for 8);
  
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
    games_played
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
    0
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, profiles.username),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update public_profiles view to ensure it includes all necessary fields
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
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
FROM public.profiles p;

-- Grant permissions
GRANT SELECT ON public.public_profiles TO anon, authenticated;
