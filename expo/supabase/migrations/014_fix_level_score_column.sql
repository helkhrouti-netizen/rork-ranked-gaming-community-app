-- ============================================
-- FIX: Ensure level_score column exists in profiles table
-- ============================================

-- Check if the column exists, if not, add it
DO $$
BEGIN
  -- Check if level_score column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'level_score'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE profiles ADD COLUMN level_score INTEGER NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added level_score column to profiles table';
  ELSE
    RAISE NOTICE 'level_score column already exists in profiles table';
  END IF;
END $$;

-- Ensure the index exists for performance
CREATE INDEX IF NOT EXISTS idx_profiles_level_score ON profiles(level_score DESC);

-- Update views to use level_score
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

-- Verify the column exists
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'level_score'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Verification successful: level_score column exists in profiles table';
  ELSE
    RAISE EXCEPTION '❌ ERROR: level_score column still does not exist in profiles table';
  END IF;
END $$;
