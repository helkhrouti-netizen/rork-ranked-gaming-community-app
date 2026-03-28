-- Fix RLS and authentication issues for development with mock auth
-- This migration ensures chat tables work without Supabase auth

-- ============================================
-- 1. COMPLETELY DISABLE RLS ON CHAT TABLES
-- ============================================
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP ALL EXISTING POLICIES (cleanup)
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

-- ============================================
-- 3. ENSURE MATCH TABLES ALSO HAVE PERMISSIVE POLICIES
-- ============================================
-- Keep RLS enabled for matches but make policies permissive for dev

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can create matches" ON matches;
DROP POLICY IF EXISTS "Hosts can update their own matches" ON matches;
DROP POLICY IF EXISTS "Hosts can delete their own matches" ON matches;

-- Create permissive policies that work without auth
CREATE POLICY "Anyone can create matches (dev)" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update matches (dev)" ON matches FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete matches (dev)" ON matches FOR DELETE USING (true);

-- Make match_participants more permissive
DROP POLICY IF EXISTS "Users can join matches" ON match_participants;
DROP POLICY IF EXISTS "Users can leave matches" ON match_participants;

CREATE POLICY "Anyone can join matches (dev)" ON match_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can leave matches (dev)" ON match_participants FOR DELETE USING (true);

-- ============================================
-- 4. FIX TRIGGER TO HANDLE MOCK USER IDS
-- ============================================
-- Update the trigger that creates chats to not fail on missing auth
CREATE OR REPLACE FUNCTION create_match_chat()
RETURNS TRIGGER AS $$
DECLARE
  new_chat_id UUID;
BEGIN
  BEGIN
    -- Create a new chat room for this match
    INSERT INTO chats (match_id, is_dm)
    VALUES (NEW.id, false)
    RETURNING id INTO new_chat_id;
    
    -- Try to add the host as the first member (may fail if host_user_id is mock)
    -- Use BEGIN/EXCEPTION to not fail the entire trigger
    BEGIN
      INSERT INTO chat_members (chat_id, user_id)
      VALUES (new_chat_id, NEW.host_user_id);
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail
        RAISE NOTICE 'Could not add host to chat (mock user): %', SQLERRM;
    END;
    
    -- Try to send welcome message (may fail if host_user_id is mock)
    BEGIN
      INSERT INTO chat_messages (chat_id, sender_id, body, is_system)
      VALUES (
        new_chat_id,
        NEW.host_user_id,
        'Match chat room created. Welcome!',
        true
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not create welcome message (mock user): %', SQLERRM;
    END;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Chat creation failed: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. GRANT ALL PERMISSIONS (for development)
-- ============================================
GRANT ALL ON chats TO anon;
GRANT ALL ON chat_members TO anon;
GRANT ALL ON chat_messages TO anon;
GRANT ALL ON matches TO anon;
GRANT ALL ON match_participants TO anon;

GRANT ALL ON chats TO authenticated;
GRANT ALL ON chat_members TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON matches TO authenticated;
GRANT ALL ON match_participants TO authenticated;
