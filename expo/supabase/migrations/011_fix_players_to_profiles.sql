-- ============================================
-- FIX: Change all references from 'players' to 'profiles'
-- ============================================

-- Drop existing views
DROP VIEW IF EXISTS match_details;
DROP VIEW IF EXISTS leaderboard;

-- Recreate match_details view with correct table name
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

-- Recreate leaderboard view with correct table name
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
