-- Row Level Security Policies for Chat System
-- This file enables RLS and creates secure policies for all chat tables

-- ============================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. MATCHES POLICIES
-- ============================================
-- Anyone can view matches
CREATE POLICY "Matches are viewable by everyone"
  ON matches FOR SELECT
  USING (true);

-- Only authenticated users can create matches
CREATE POLICY "Authenticated users can create matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

-- Only host can update their match
CREATE POLICY "Hosts can update their own matches"
  ON matches FOR UPDATE
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

-- Only host can delete their match
CREATE POLICY "Hosts can delete their own matches"
  ON matches FOR DELETE
  USING (auth.uid() = host_user_id);

-- ============================================
-- 3. MATCH_PARTICIPANTS POLICIES
-- ============================================
-- Anyone can view participants
CREATE POLICY "Match participants are viewable by everyone"
  ON match_participants FOR SELECT
  USING (true);

-- Users can join a match (insert themselves)
CREATE POLICY "Users can join matches"
  ON match_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave a match (delete themselves)
CREATE POLICY "Users can leave matches"
  ON match_participants FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. CHATS POLICIES
-- ============================================
-- Users can only view chats they are members of
CREATE POLICY "Users can view chats they are members of"
  ON chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_members
      WHERE chat_members.chat_id = chats.id
        AND chat_members.user_id = auth.uid()
    )
  );

-- System/functions can create chats (used by server-side functions)
CREATE POLICY "Service can create chats"
  ON chats FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 5. CHAT_MEMBERS POLICIES
-- ============================================
-- Users can view members of chats they belong to
CREATE POLICY "Users can view members of their chats"
  ON chat_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_members cm
      WHERE cm.chat_id = chat_members.chat_id
        AND cm.user_id = auth.uid()
    )
  );

-- System can add members (used when joining matches)
CREATE POLICY "Service can add chat members"
  ON chat_members FOR INSERT
  WITH CHECK (true);

-- Users can remove themselves from chats
CREATE POLICY "Users can leave chats"
  ON chat_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. CHAT_MESSAGES POLICIES
-- ============================================
-- Users can view messages in chats they are members of
CREATE POLICY "Users can view messages in their chats"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_members
      WHERE chat_members.chat_id = chat_messages.chat_id
        AND chat_members.user_id = auth.uid()
    )
  );

-- Users can send messages to chats they are members of
CREATE POLICY "Users can send messages to their chats"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_members
      WHERE chat_members.chat_id = chat_messages.chat_id
        AND chat_members.user_id = auth.uid()
    )
  );

-- Users can update (edit) their own messages
CREATE POLICY "Users can edit their own messages"
  ON chat_messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  USING (sender_id = auth.uid());

-- ============================================
-- 7. GRANT PERMISSIONS FOR FUNCTIONS
-- ============================================
-- Allow authenticated users to execute the DM function
GRANT EXECUTE ON FUNCTION get_or_create_dm_chat(UUID, UUID) TO authenticated;
