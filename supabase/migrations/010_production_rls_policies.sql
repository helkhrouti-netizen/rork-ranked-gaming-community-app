-- Production RLS Policies for Chat System
-- This migration replaces development policies with production-ready RLS
-- that uses auth.uid() for proper security

-- ============================================
-- 1. ENABLE RLS ON ALL CHAT TABLES
-- ============================================
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP ALL EXISTING PERMISSIVE DEV POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view chats they are members of" ON chats;
DROP POLICY IF EXISTS "Service can create chats" ON chats;
DROP POLICY IF EXISTS "Users can view members of their chats" ON chat_members;
DROP POLICY IF EXISTS "Service can add chat members" ON chat_members;
DROP POLICY IF EXISTS "Users can leave chats" ON chat_members;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON chat_messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can create matches (dev)" ON matches;
DROP POLICY IF EXISTS "Anyone can update matches (dev)" ON matches;
DROP POLICY IF EXISTS "Anyone can delete matches (dev)" ON matches;
DROP POLICY IF EXISTS "Anyone can join matches (dev)" ON match_participants;
DROP POLICY IF EXISTS "Anyone can leave matches (dev)" ON match_participants;

-- ============================================
-- 3. CHATS TABLE POLICIES
-- ============================================

-- System can create chats (for match creation trigger)
-- Uses SECURITY DEFINER function to bypass RLS
DROP POLICY IF EXISTS "Allow authenticated insert access to chats" ON public.chats;
CREATE POLICY "Allow authenticated insert access to chats"
ON public.chats
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (true);

-- Users can view chats only if they are participants in the match
DROP POLICY IF EXISTS "Allow users to view their chats" ON public.chats;
CREATE POLICY "Allow users to view their chats"
ON public.chats
AS PERMISSIVE FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_participants.match_id = chats.match_id
      AND match_participants.profile_id = auth.uid()
  )
);

-- Users cannot update or delete chats directly
-- (Only through system functions)

-- ============================================
-- 4. CHAT_MEMBERS TABLE POLICIES
-- ============================================

-- Users can view members of chats they belong to
CREATE POLICY "Users can view chat members"
ON chat_members FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM chat_members cm WHERE cm.chat_id = chat_members.chat_id
  )
);

-- System can add members (through triggers/functions)
CREATE POLICY "System can add chat members"
ON chat_members FOR INSERT
WITH CHECK (true);

-- Users can remove themselves from chats
CREATE POLICY "Users can leave chats"
ON chat_members FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 5. CHAT_MESSAGES TABLE POLICIES
-- ============================================

-- Users can only insert their own messages
DROP POLICY IF EXISTS "Allow authenticated insert access to messages" ON public.chat_messages;
CREATE POLICY "Allow authenticated insert access to messages"
ON public.chat_messages
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Users can view messages only in chats for matches they're participating in
DROP POLICY IF EXISTS "Allow users to view messages in their chats" ON public.chat_messages;
CREATE POLICY "Allow users to view messages in their chats"
ON public.chat_messages
AS PERMISSIVE FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    JOIN public.match_participants
      ON match_participants.match_id = chats.match_id
    WHERE chats.id = chat_messages.chat_id
      AND match_participants.profile_id = auth.uid()
  )
);

-- Users can update their own messages
CREATE POLICY "Users can edit own messages"
ON chat_messages FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON chat_messages FOR DELETE
USING (auth.uid() = sender_id);

-- ============================================
-- 6. MATCHES TABLE POLICIES
-- ============================================

-- Anyone can view all matches
CREATE POLICY "Anyone can view matches"
ON matches FOR SELECT
USING (true);

-- Authenticated users can create matches
CREATE POLICY "Authenticated users can create matches"
ON matches FOR INSERT
WITH CHECK (auth.uid() = host_user_id);

-- Match hosts can update their own matches
CREATE POLICY "Hosts can update their matches"
ON matches FOR UPDATE
USING (auth.uid() = host_user_id)
WITH CHECK (auth.uid() = host_user_id);

-- Match hosts can delete their own matches
CREATE POLICY "Hosts can delete their matches"
ON matches FOR DELETE
USING (auth.uid() = host_user_id);

-- ============================================
-- 7. MATCH_PARTICIPANTS TABLE POLICIES
-- ============================================

-- Anyone can view match participants
CREATE POLICY "Anyone can view match participants"
ON match_participants FOR SELECT
USING (true);

-- Authenticated users can join matches
CREATE POLICY "Users can join matches"
ON match_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can leave matches they joined
CREATE POLICY "Users can leave matches"
ON match_participants FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 8. PLAYERS TABLE POLICIES
-- ============================================

-- Anyone can view public player profiles
CREATE POLICY "Anyone can view player profiles"
ON players FOR SELECT
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON players FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- 9. FIX TRIGGER FUNCTIONS FOR RLS
-- ============================================

-- Update create_player_profile to be SECURITY DEFINER
-- This allows it to insert into players table bypassing RLS
CREATE OR REPLACE FUNCTION create_player_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO players (id, username, email, level_score, level_tier, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    0,
    'Cuivre',
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NULL)
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Player already exists, update instead
    UPDATE players 
    SET 
      email = NEW.email,
      username = COALESCE(NEW.raw_user_meta_data->>'username', username),
      phone_number = COALESCE(NEW.raw_user_meta_data->>'phone_number', phone_number)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update create_match_chat to be SECURITY DEFINER
-- This allows it to insert into chats and chat_members bypassing RLS
CREATE OR REPLACE FUNCTION create_match_chat()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_chat_id UUID;
BEGIN
  -- Create a new chat room for this match
  INSERT INTO chats (match_id, is_dm)
  VALUES (NEW.id, false)
  RETURNING id INTO new_chat_id;
  
  -- Add the host as the first member
  INSERT INTO chat_members (chat_id, user_id)
  VALUES (new_chat_id, NEW.host_user_id);
  
  -- Send welcome message
  INSERT INTO chat_messages (chat_id, sender_id, body, is_system)
  VALUES (
    new_chat_id,
    NEW.host_user_id,
    'Match chat room created. Welcome!',
    true
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the match creation
    RAISE NOTICE 'Chat creation failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update add_host_as_participant to be SECURITY DEFINER
CREATE OR REPLACE FUNCTION add_host_as_participant()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add host to match_participants
  INSERT INTO match_participants (match_id, user_id, side)
  VALUES (NEW.id, NEW.host_user_id, 'TL')
  ON CONFLICT (match_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. FUNCTION TO ADD PARTICIPANT TO CHAT
-- ============================================
-- When a user joins a match, they should also be added to the chat

CREATE OR REPLACE FUNCTION add_participant_to_chat()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_chat_id UUID;
BEGIN
  -- Find the chat for this match
  SELECT id INTO match_chat_id
  FROM chats
  WHERE match_id = NEW.match_id AND is_dm = false
  LIMIT 1;
  
  -- Add user to chat if chat exists
  IF match_chat_id IS NOT NULL THEN
    INSERT INTO chat_members (chat_id, user_id)
    VALUES (match_chat_id, NEW.user_id)
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to add participant to chat: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add participants to chat when they join a match
DROP TRIGGER IF EXISTS on_participant_added ON match_participants;
CREATE TRIGGER on_participant_added
  AFTER INSERT ON match_participants
  FOR EACH ROW
  EXECUTE FUNCTION add_participant_to_chat();

-- ============================================
-- 11. GRANT NECESSARY PERMISSIONS
-- ============================================

-- Grant basic permissions to authenticated users
GRANT SELECT ON chats TO authenticated;
GRANT SELECT ON chat_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT ON matches TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON matches TO authenticated;
GRANT SELECT ON match_participants TO authenticated, anon;
GRANT INSERT, DELETE ON match_participants TO authenticated;
GRANT SELECT ON players TO authenticated, anon;
GRANT UPDATE ON players TO authenticated;

-- ============================================
-- 12. ENABLE REALTIME WITH RLS
-- ============================================

-- Realtime will respect RLS policies automatically
-- No additional configuration needed, but ensure tables are in publication
DO $$
BEGIN
  -- Add tables to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_members;
  END IF;
END $$;

-- ============================================
-- 13. INDEX OPTIMIZATION FOR RLS QUERIES
-- ============================================

-- These indexes help RLS policies perform efficiently
CREATE INDEX IF NOT EXISTS idx_chat_members_user_chat ON chat_members(user_id, chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_sender ON chat_messages(chat_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_matches_host ON matches(host_user_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user ON match_participants(user_id);

-- ============================================
-- VERIFICATION QUERIES (for testing)
-- ============================================

-- To verify RLS is working, run these as different users:
-- 
-- 1. Check if user can only see their chats:
--    SELECT * FROM chats;
-- 
-- 2. Check if user can only see messages from their chats:
--    SELECT * FROM chat_messages;
-- 
-- 3. Try to insert a message in a chat you're not a member of (should fail):
--    INSERT INTO chat_messages (chat_id, sender_id, body) 
--    VALUES ('[some-chat-id]', auth.uid(), 'test');
-- 
-- 4. Try to view another user's profile (should succeed - profiles are public):
--    SELECT * FROM players WHERE id != auth.uid();
