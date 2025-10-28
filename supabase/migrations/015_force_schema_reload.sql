-- ============================================
-- FORCE PostgREST Schema Cache Reload
-- ============================================

-- Send a NOTIFY signal to PostgREST to reload its schema cache
-- This will make PostgREST aware of all the column changes
NOTIFY pgrst, 'reload schema';

-- Double-check that level_score column exists
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'level_score'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ level_score column exists in profiles table';
  ELSE
    RAISE EXCEPTION '❌ ERROR: level_score column does not exist in profiles table';
  END IF;
END $$;

-- List all columns in profiles table for verification
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
