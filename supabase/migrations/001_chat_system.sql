-- Chat System Migration
-- This migration creates all tables needed for the chat system

-- ============================================
-- 1. MATCHES TABLE (extend if not exists)
-- ============================================
-- Note: If matches table already exists, just ensure it has these columns
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('official', 'friendly')),
  status TEXT NOT NULL CHECK (status IN ('waiting', 'in_progress', 'completed', 'pending_validation', 'disputed')),
  max_players INTEGER NOT NULL DEFAULT 4,
  point_reward INTEGER NOT NULL DEFAULT 0,
  point_penalty INTEGER NOT NULL DEFAULT 0,
  field_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_host ON matches(host_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);

-- ============================================
-- 2. MATCH_PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS match_participants (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  side TEXT CHECK (side IN ('TL', 'TR', 'BL', 'BR')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_participants_user ON match_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_match ON match_participants(match_id);

-- ============================================
-- 3. CHATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  is_dm BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_match ON chats(match_id);
CREATE INDEX IF NOT EXISTS idx_chats_dm ON chats(is_dm);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chats_unique_match_group ON chats(match_id) WHERE is_dm = false;

-- ============================================
-- 4. CHAT_MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_members (
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_chat ON chat_members(chat_id);

-- ============================================
-- 5. CHAT_MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_system BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created ON chat_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);

-- ============================================
-- 6. HELPER FUNCTION: Get or create DM chat
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_dm_chat(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_chat_id UUID;
  new_chat_id UUID;
  min_user_id UUID;
  max_user_id UUID;
BEGIN
  -- Order user IDs to ensure consistency
  IF user1_id < user2_id THEN
    min_user_id := user1_id;
    max_user_id := user2_id;
  ELSE
    min_user_id := user2_id;
    max_user_id := user1_id;
  END IF;

  -- Try to find existing DM between these users
  SELECT c.id INTO existing_chat_id
  FROM chats c
  INNER JOIN chat_members cm1 ON c.id = cm1.chat_id AND cm1.user_id = min_user_id
  INNER JOIN chat_members cm2 ON c.id = cm2.chat_id AND cm2.user_id = max_user_id
  WHERE c.is_dm = true
    AND c.match_id IS NULL
  LIMIT 1;

  -- If found, return it
  IF existing_chat_id IS NOT NULL THEN
    RETURN existing_chat_id;
  END IF;

  -- Otherwise, create new DM chat
  INSERT INTO chats (is_dm, match_id)
  VALUES (true, NULL)
  RETURNING id INTO new_chat_id;

  -- Add both users as members
  INSERT INTO chat_members (chat_id, user_id)
  VALUES 
    (new_chat_id, min_user_id),
    (new_chat_id, max_user_id);

  RETURN new_chat_id;
END;
$$;

-- ============================================
-- 7. TRIGGER: Update matches updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_members;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_participants;
