-- Temporary: Disable RLS for development with mock auth
-- WARNING: This is for development only. For production, use proper Supabase authentication.

-- ============================================
-- DISABLE RLS TEMPORARILY FOR DEV
-- ============================================
-- Since the app uses mock authentication (not real Supabase auth),
-- we need to disable RLS or create permissive policies

-- Option 1: Completely disable RLS (easiest for dev)
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Note: matches and match_participants still have RLS enabled
-- but with permissive policies that work without auth
