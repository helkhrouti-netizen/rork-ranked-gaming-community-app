-- ============================================
-- FIX: Replace ALL 'players' references with 'profiles'
-- This fixes RLS policies and trigger functions
-- ============================================

-- ============================================
-- 1. DROP OLD POLICIES ON 'PLAYERS' TABLE
-- ============================================
DROP POLICY IF EXISTS "Anyone can view player profiles" ON players;
DROP POLICY IF EXISTS "Users can update own profile" ON players;

-- ============================================
-- 2. CREATE NEW POLICIES ON 'PROFILES' TABLE
-- ============================================

-- Anyone can view public player profiles
CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. FIX TRIGGER FUNCTION TO USE 'PROFILES'
-- ============================================

-- Update create_player_profile to insert into 'profiles' table
CREATE OR REPLACE FUNCTION create_player_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username, email, level_score, level_tier, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    0,
    'Cuivre',
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NULL)
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, profiles.username),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. GRANT PERMISSIONS ON 'PROFILES' TABLE
-- ============================================

GRANT SELECT ON profiles TO authenticated, anon;
GRANT UPDATE ON profiles TO authenticated;

-- ============================================
-- 5. ADD INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_level_score ON profiles(level_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- ============================================
-- 6. VERIFICATION
-- ============================================
-- Run: SELECT * FROM profiles WHERE id = auth.uid();
-- Should return your profile
