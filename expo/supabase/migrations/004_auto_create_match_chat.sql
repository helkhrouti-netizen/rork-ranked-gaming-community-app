-- Auto-create chat room when a match is created
-- This ensures every match has a chat room with a valid UUID

-- ============================================
-- TRIGGER: Create chat room for new matches
-- ============================================
CREATE OR REPLACE FUNCTION create_match_chat()
RETURNS TRIGGER AS $$
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
  
  -- Send a welcome system message
  INSERT INTO chat_messages (chat_id, sender_id, body, is_system)
  VALUES (
    new_chat_id,
    NEW.host_user_id,
    'Match chat room created. Welcome!',
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_match_created_chat ON matches;

-- Create the trigger
CREATE TRIGGER on_match_created_chat
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION create_match_chat();
