-- ============================================
-- COMPLETE DATABASE SETUP FOR PADEL APP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  level_score INTEGER NOT NULL DEFAULT 0,
  level_tier TEXT NOT NULL DEFAULT 'Cuivre',
  rank_division TEXT NOT NULL DEFAULT 'Cuivre',
  rank_sub INTEGER NOT NULL DEFAULT 1,
  rank_points INTEGER NOT NULL DEFAULT 0,
  profile_picture TEXT,
  city TEXT,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  reputation INTEGER NOT NULL DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_level_score ON public.profiles(level_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

-- ============================================
-- 2. CREATE MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  level_restriction TEXT,
  max_players INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'open',
  result TEXT,
  court_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_host_user_id ON public.matches(host_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_city ON public.matches(city);

-- ============================================
-- 3. CREATE MATCH PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  team TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON public.match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user_id ON public.match_participants(user_id);

-- ============================================
-- 4. CREATE CHAT TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- ============================================
-- 5. CREATE MATCH HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  result TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_match_history_player_id ON public.match_history(player_id);
CREATE INDEX IF NOT EXISTS idx_match_history_match_id ON public.match_history(match_id);

-- ============================================
-- 6. ENABLE RLS (Row Level Security)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE RLS POLICIES
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Matches policies
DROP POLICY IF EXISTS "Anyone can view matches" ON public.matches;
CREATE POLICY "Anyone can view matches"
ON public.matches FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create matches" ON public.matches;
CREATE POLICY "Authenticated users can create matches"
ON public.matches FOR INSERT
WITH CHECK (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Match hosts can update their matches" ON public.matches;
CREATE POLICY "Match hosts can update their matches"
ON public.matches FOR UPDATE
USING (auth.uid() = host_user_id)
WITH CHECK (auth.uid() = host_user_id);

-- Match participants policies
DROP POLICY IF EXISTS "Anyone can view match participants" ON public.match_participants;
CREATE POLICY "Anyone can view match participants"
ON public.match_participants FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can join matches" ON public.match_participants;
CREATE POLICY "Authenticated users can join matches"
ON public.match_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Match hosts can manage participants" ON public.match_participants;
CREATE POLICY "Match hosts can manage participants"
ON public.match_participants FOR UPDATE
USING (
  auth.uid() IN (
    SELECT host_user_id FROM matches WHERE id = match_id
  )
);

-- Chat policies
DROP POLICY IF EXISTS "Match participants can view chats" ON public.chats;
CREATE POLICY "Match participants can view chats"
ON public.chats FOR SELECT
USING (
  match_id IN (
    SELECT match_id FROM match_participants WHERE user_id = auth.uid()
    UNION
    SELECT id FROM matches WHERE host_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can create chats" ON public.chats;
CREATE POLICY "System can create chats"
ON public.chats FOR INSERT
WITH CHECK (true);

-- Chat messages policies
DROP POLICY IF EXISTS "Match participants can view messages" ON public.chat_messages;
CREATE POLICY "Match participants can view messages"
ON public.chat_messages FOR SELECT
USING (
  chat_id IN (
    SELECT c.id FROM chats c
    INNER JOIN matches m ON c.match_id = m.id
    WHERE m.host_user_id = auth.uid()
       OR m.id IN (SELECT match_id FROM match_participants WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Match participants can send messages" ON public.chat_messages;
CREATE POLICY "Match participants can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  chat_id IN (
    SELECT c.id FROM chats c
    INNER JOIN matches m ON c.match_id = m.id
    WHERE m.host_user_id = auth.uid()
       OR m.id IN (SELECT match_id FROM match_participants WHERE user_id = auth.uid())
  )
);

-- Match history policies
DROP POLICY IF EXISTS "Users can view their own match history" ON public.match_history;
CREATE POLICY "Users can view their own match history"
ON public.match_history FOR SELECT
USING (player_id = auth.uid());

DROP POLICY IF EXISTS "System can create match history" ON public.match_history;
CREATE POLICY "System can create match history"
ON public.match_history FOR INSERT
WITH CHECK (true);

-- ============================================
-- 8. CREATE TRIGGER FUNCTION FOR AUTO PROFILE CREATION
-- ============================================
CREATE OR REPLACE FUNCTION public.create_player_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
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

-- ============================================
-- 9. CREATE TRIGGER FOR AUTO PROFILE CREATION
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_player_profile();

-- ============================================
-- 10. CREATE TRIGGER FOR AUTO CHAT CREATION
-- ============================================
CREATE OR REPLACE FUNCTION public.create_match_chat()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.chats (match_id)
  VALUES (NEW.id)
  ON CONFLICT (match_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating chat: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_match_created ON public.matches;
CREATE TRIGGER on_match_created
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_chat();

-- ============================================
-- 11. CREATE VIEWS
-- ============================================
DROP VIEW IF EXISTS public.match_details;
CREATE OR REPLACE VIEW public.match_details AS
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

DROP VIEW IF EXISTS public.leaderboard;
CREATE OR REPLACE VIEW public.leaderboard AS
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
-- 12. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.matches TO anon, authenticated;
GRANT INSERT, UPDATE ON public.matches TO authenticated;
GRANT SELECT ON public.match_participants TO anon, authenticated;
GRANT INSERT, UPDATE ON public.match_participants TO authenticated;
GRANT SELECT ON public.chats TO authenticated;
GRANT INSERT ON public.chats TO authenticated;
GRANT SELECT ON public.chat_messages TO authenticated;
GRANT INSERT ON public.chat_messages TO authenticated;
GRANT SELECT ON public.match_history TO authenticated;
GRANT INSERT ON public.match_history TO authenticated;
GRANT SELECT ON public.match_details TO anon, authenticated;
GRANT SELECT ON public.leaderboard TO anon, authenticated;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- You can verify the setup by running:
-- SELECT * FROM profiles LIMIT 5;
-- SELECT * FROM matches LIMIT 5;
