-- ============================================
-- CRITICAL FIX: Rename 'players' table to 'profiles'
-- The application code references 'profiles' but the table is named 'players'
-- ============================================

-- ============================================
-- 1. RENAME THE TABLE
-- ============================================
ALTER TABLE IF EXISTS players RENAME TO profiles;

-- ============================================
-- 2. UPDATE ALL CONSTRAINTS AND INDEXES
-- ============================================

-- Rename indexes
ALTER INDEX IF EXISTS idx_players_username RENAME TO idx_profiles_username;
ALTER INDEX IF EXISTS idx_players_level_score RENAME TO idx_profiles_level_score;
ALTER INDEX IF EXISTS idx_players_city RENAME TO idx_profiles_city;

-- ============================================
-- 3. UPDATE RLS POLICIES
-- ============================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Anyone can view player profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- Create correct policies
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. FIX TRIGGER FUNCTION
-- ============================================

-- Update create_player_profile function to use 'profiles'
CREATE OR REPLACE FUNCTION create_player_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (
    id, 
    username, 
    email, 
    level_score, 
    level_tier, 
    rank_division,
    rank_sub,
    rank_points,
    phone_number
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    0,
    'Cuivre',
    'Cuivre',
    1,
    0,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NULL)
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, profiles.username),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_player_profile();

-- ============================================
-- 5. ENABLE RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================
GRANT SELECT ON profiles TO authenticated, anon;
GRANT INSERT, UPDATE ON profiles TO authenticated;

-- ============================================
-- 7. RECREATE VIEWS WITH CORRECT TABLE NAME
-- ============================================

DROP VIEW IF EXISTS match_details;
CREATE OR REPLACE VIEW match_details AS
SELECT 
  m.*,
  p.username as host_username,
  p.level_tier as host_level_tier,
  p.level_score as host_level_score,
  p.profile_picture as host_avatar,
  p.wins as host_wins,
  p.losses as host_losses,
  (SELECT COUNT(*) FROM match_participants mp WHERE mp.match_id = m.id) as current_players
FROM matches m
LEFT JOIN profiles p ON m.host_user_id = p.id;

DROP VIEW IF EXISTS leaderboard;
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY level_score DESC) as rank,
  id as player_id,
  username,
  level_score,
  level_tier,
  wins,
  losses,
  reputation,
  city
FROM profiles
ORDER BY level_score DESC;

-- ============================================
-- 8. ADD MISSING COLUMNS IF NEEDED
-- ============================================

-- Ensure all required columns exist
DO $$
BEGIN
  -- Add rank_division if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'rank_division'
  ) THEN
    ALTER TABLE profiles ADD COLUMN rank_division TEXT NOT NULL DEFAULT 'Cuivre';
  END IF;

  -- Add rank_sub if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'rank_sub'
  ) THEN
    ALTER TABLE profiles ADD COLUMN rank_sub INTEGER NOT NULL DEFAULT 1;
  END IF;

  -- Add rank_points if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'rank_points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN rank_points INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these queries to verify:
-- SELECT * FROM profiles LIMIT 5;
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
