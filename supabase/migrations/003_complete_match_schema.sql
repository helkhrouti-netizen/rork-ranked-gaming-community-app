-- Complete Match System Schema
-- This migration creates all tables needed for matches and players

-- ============================================
-- 1. PLAYERS/USERS PROFILE TABLE
-- ============================================
-- Extends auth.users with game-specific data
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  city TEXT NOT NULL DEFAULT 'CASABLANCA',
  
  -- Ranking/Stats
  level_score INTEGER NOT NULL DEFAULT 0,
  level_tier TEXT NOT NULL DEFAULT 'Cuivre',
  rank_division TEXT NOT NULL DEFAULT 'Cuivre',
  rank_sub INTEGER NOT NULL DEFAULT 1,
  rank_points INTEGER NOT NULL DEFAULT 0,
  
  -- Game Stats
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  reputation DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  level INTEGER NOT NULL DEFAULT 1,
  
  -- Preferences
  preferred_side TEXT CHECK (preferred_side IN ('top-left', 'top-right', 'bottom-left', 'bottom-right')),
  profile_picture TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_players_level_score ON players(level_score DESC);
CREATE INDEX IF NOT EXISTS idx_players_city ON players(city);

-- ============================================
-- 2. MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Match Config
  match_type TEXT NOT NULL CHECK (match_type IN ('official', 'friendly')),
  status TEXT NOT NULL CHECK (status IN ('waiting', 'in_progress', 'completed', 'pending_validation', 'disputed')),
  max_players INTEGER NOT NULL DEFAULT 4,
  
  -- Host Info
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Location (stored as JSON for flexibility)
  field_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_city TEXT NOT NULL,
  field_address TEXT NOT NULL,
  field_type TEXT CHECK (field_type IN ('indoor', 'outdoor')),
  
  -- Points/Rewards
  point_reward INTEGER NOT NULL DEFAULT 25,
  point_penalty INTEGER NOT NULL DEFAULT 15,
  
  -- Optional scheduling
  scheduled_time TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_host ON matches(host_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_type ON matches(match_type);
CREATE INDEX IF NOT EXISTS idx_matches_field_city ON matches(field_city);

-- ============================================
-- 3. MATCH_PARTICIPANTS TABLE
-- ============================================
-- Tracks who joined which match
CREATE TABLE IF NOT EXISTS match_participants (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Court position (TL=top-left, TR=top-right, BL=bottom-left, BR=bottom-right)
  side TEXT CHECK (side IN ('TL', 'TR', 'BL', 'BR')),
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_participants_user ON match_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_match ON match_participants(match_id);

-- ============================================
-- 4. MATCH_POSITIONS TABLE (Player positions)
-- ============================================
-- Maps players to court positions (for UI display)
CREATE TABLE IF NOT EXISTS match_positions (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (match_id, player_id),
  UNIQUE (match_id, position)
);

CREATE INDEX IF NOT EXISTS idx_match_positions_match ON match_positions(match_id);
CREATE INDEX IF NOT EXISTS idx_match_positions_player ON match_positions(player_id);

-- ============================================
-- 5. MATCH_RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  
  -- Scores
  team1_score INTEGER NOT NULL DEFAULT 0,
  team2_score INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'validated', 'disputed')),
  
  -- Validation
  validated_at TIMESTAMPTZ,
  disputed_reason TEXT,
  ratings_required BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_results_match ON match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_status ON match_results(status);

-- ============================================
-- 6. SCORE_SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS score_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  
  team1_score INTEGER NOT NULL,
  team2_score INTEGER NOT NULL,
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_score_submissions_match ON score_submissions(match_id);
CREATE INDEX IF NOT EXISTS idx_score_submissions_player ON score_submissions(player_id);

-- ============================================
-- 7. PLAYER_RATINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS player_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  rated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_player UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (match_id, rated_by, rated_player)
);

CREATE INDEX IF NOT EXISTS idx_player_ratings_match ON player_ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_rated_player ON player_ratings(rated_player);

-- ============================================
-- 8. TRIGGERS: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_match_results_updated_at ON match_results;
CREATE TRIGGER update_match_results_updated_at
  BEFORE UPDATE ON match_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. HELPER FUNCTION: Create player from auth.users
-- ============================================
-- This function is called when a new user signs up
CREATE OR REPLACE FUNCTION create_player_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO players (id, username, email, level_score, level_tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    0,
    'Cuivre'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create player profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_player_profile();

-- ============================================
-- 10. HELPER FUNCTION: Auto-add host as participant
-- ============================================
CREATE OR REPLACE FUNCTION add_host_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  -- Add host to match_participants
  INSERT INTO match_participants (match_id, user_id, side)
  VALUES (NEW.id, NEW.host_user_id, 'TL')
  ON CONFLICT (match_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_match_created ON matches;
CREATE TRIGGER on_match_created
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION add_host_as_participant();

-- ============================================
-- 11. VIEW: Match Details (with player data)
-- ============================================
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
LEFT JOIN players p ON m.host_user_id = p.id;

-- ============================================
-- 12. VIEW: Leaderboard
-- ============================================
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
FROM players
ORDER BY level_score DESC;

-- ============================================
-- 13. ENABLE REALTIME for match updates
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE match_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE score_submissions;
