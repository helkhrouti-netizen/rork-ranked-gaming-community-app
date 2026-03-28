-- RLS Policy: Allow match participants to view host phone number
-- This policy allows users to SELECT the phone_number of profiles 
-- ONLY IF they are participants in the same match as the host

-- First, ensure RLS is enabled on profiles/players table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policy with the same name
DROP POLICY IF EXISTS "Match participants can view host phone" ON profiles;

-- Create the RLS policy
CREATE POLICY "Match participants can view host phone" 
ON profiles 
FOR SELECT 
USING (
  -- Allow users to view a profile's phone_number if:
  -- 1. They are requesting their own profile OR
  -- 2. They are in the same match as the profile owner
  auth.uid() = id 
  OR 
  EXISTS (
    -- Check if the requesting user is a participant in any match
    SELECT 1 FROM match_participants mp1
    WHERE mp1.user_id = auth.uid()
    AND EXISTS (
      -- Check if the profile owner is also in the same match
      SELECT 1 FROM match_participants mp2
      WHERE mp2.match_id = mp1.match_id
      AND mp2.user_id = profiles.id
    )
  )
);

-- Alternative: If you're using the 'players' table instead of 'profiles'
-- Uncomment the following if your table is named 'players'

-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Match participants can view host phone" ON players;
-- CREATE POLICY "Match participants can view host phone" 
-- ON players 
-- FOR SELECT 
-- USING (
--   auth.uid() = id 
--   OR 
--   EXISTS (
--     SELECT 1 FROM match_participants mp1
--     WHERE mp1.user_id = auth.uid()
--     AND EXISTS (
--       SELECT 1 FROM match_participants mp2
--       WHERE mp2.match_id = mp1.match_id
--       AND mp2.user_id = players.id
--     )
--   )
-- );
