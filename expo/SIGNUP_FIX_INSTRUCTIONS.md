# Signup Database Error - Fix Instructions

## Problem
The signup was failing with "Database error saving new user" because:
1. The `profiles` table had `username TEXT UNIQUE NOT NULL`
2. The trigger function could generate duplicate usernames from email patterns
3. This caused UNIQUE constraint violations during signup

## Solution

### Step 1: Run the New Migration
Run this SQL migration in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/020_fix_username_constraint.sql
```

This migration:
- ✅ Removes the UNIQUE constraint on username
- ✅ Makes username nullable (users set it during onboarding)
- ✅ Updates the trigger function to handle errors gracefully
- ✅ Generates unique temporary usernames using user ID if needed

### Step 2: Code Changes (Already Done)
The `contexts/AuthContext.tsx` has been updated to:
- ✅ Wait for the trigger to create the profile (up to 2.5 seconds)
- ✅ If trigger fails, manually create the profile with all required fields
- ✅ Throw proper error messages if manual creation fails
- ✅ Handle profile creation more robustly

## Testing the Fix

1. **Navigate to Supabase SQL Editor**
   - Go to your Supabase dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the Migration**
   - Copy the contents of `supabase/migrations/020_fix_username_constraint.sql`
   - Paste it into the SQL Editor
   - Click "Run" button

3. **Test Signup**
   - Try creating a new account with the signup form
   - Check the console logs for detailed information
   - Signup should complete successfully
   - You should be redirected to `/onboarding`

## Expected Flow

1. User fills signup form (username, email, phone, password)
2. Supabase creates auth user
3. Trigger creates profile automatically (or app creates it manually)
4. Profile gets updated with username and phone
5. User is redirected to onboarding to complete their profile

## What to Look For

### Success Indicators
- ✅ Console log: "✅ Profile created by trigger" or "✅ Profile updated successfully"
- ✅ Console log: "✅ Signup successful: [email]"
- ✅ Redirect to `/onboarding` screen

### Error Indicators
- ❌ "Database error saving new user" - Migration not run yet
- ❌ "Profile update warning" - Minor issue, but signup should still work
- ❌ "Manual profile creation error" - Check RLS policies

## Verification

After running the migration, verify the schema:

```sql
-- Check profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

## Troubleshooting

### If signup still fails:

1. **Check trigger function logs**
   ```sql
   -- Look for warnings in Supabase logs
   SELECT * FROM pg_stat_statements WHERE query LIKE '%handle_new_user%';
   ```

2. **Manually test profile creation**
   ```sql
   -- Test if you can insert a profile
   INSERT INTO public.profiles (id, email, username, level_score, level_tier)
   VALUES (gen_random_uuid(), 'test@example.com', 'testuser', 0, 'Cuivre');
   
   -- Clean up test
   DELETE FROM public.profiles WHERE email = 'test@example.com';
   ```

3. **Check RLS policies**
   ```sql
   -- List all policies on profiles table
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

4. **If trigger isn't working, disable it temporarily**
   The app will handle profile creation manually:
   ```sql
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   ```

## Next Steps

After successful signup, users will:
1. See the onboarding screen
2. Complete the skill assessment
3. Set their username, city, and avatar
4. Get their initial rank assigned
5. Start using the app

## Notes

- The migration is safe to run multiple times (it uses `IF EXISTS` and `IF NOT EXISTS`)
- Existing user profiles will not be affected
- Username uniqueness can be enforced at the app level during onboarding if needed
