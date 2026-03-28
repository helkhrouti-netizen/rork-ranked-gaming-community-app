# Fix Instructions for Chat Errors

## Issues Fixed

1. **❌ Failed to create chat: Error: new row violates row-level security policy for table "chats"**
2. **❌ Error joining match: Error: Already in match**
3. **❌ Failed to create chat: [object Object]**

## Root Cause

The application uses **mock authentication** (stored in AsyncStorage) but the Supabase database expects **real Supabase authentication** for Row Level Security (RLS) policies. This mismatch causes:
- Chat creation to fail due to RLS policies
- Error messages to be unclear
- "Already in match" errors showing incorrectly

## Solution Applied

### 1. Frontend Improvements (`app/match/[id].tsx` & `services/chat.ts`)

- **Better error handling**: Wrapped all chat operations in try-catch with detailed error messages
- **Duplicate join prevention**: Check if user is already in match before joining
- **Non-critical chat failures**: Allow match operations to succeed even if chat operations fail
- **Better error messages**: Show actual error messages instead of `[object Object]`

### 2. Database Migration (`supabase/migrations/006_fix_rls_and_auth.sql`)

This migration completely disables RLS on chat tables for development with mock auth:

- Disables RLS on `chats`, `chat_members`, and `chat_messages` tables
- Makes match table policies permissive (work without auth)
- Updates triggers to handle mock user IDs gracefully
- Grants necessary permissions to `anon` and `authenticated` roles

## How to Apply the Database Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/006_fix_rls_and_auth.sql`
5. Paste into the query editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Using psql (Direct Database Connection)

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.mcgqjqkknmojspocvvxl.supabase.co:5432/postgres"

# Run the migration file
\i supabase/migrations/006_fix_rls_and_auth.sql
```

## Verification Steps

After applying the migration:

1. **Restart your Expo app**:
   ```bash
   # Stop the dev server (Ctrl+C)
   # Clear cache and restart
   npx expo start -c
   ```

2. **Test the flow**:
   - Navigate to a match details page
   - Click "Join Match"
   - Verify no "Already in match" errors appear
   - Click "Open Match Chat"
   - Verify chat opens successfully

3. **Check console logs**:
   - Should see: `✅ Chat created with UUID: [uuid]`
   - Should see: `✅ Added user to chat: [uuid]`
   - Should NOT see: `❌ Failed to create chat: new row violates row-level security`

## Expected Behavior

### Before Fix
```
❌ Failed to create chat: Error: new row violates row-level security policy for table "chats"
❌ Error joining match: Error: Already in match
❌ Failed to create chat: [object Object]
```

### After Fix
```
✅ Chat created with UUID: 123e4567-e89b-12d3-a456-426614174000
✅ Added user to chat: 123e4567-e89b-12d3-a456-426614174000
✅ User added to chat
```

## Important Notes

- **This is a development configuration**: For production, you should implement proper Supabase authentication
- **RLS is disabled on chat tables**: This means anyone can read/write chat data (acceptable for development)
- **Mock auth continues to work**: The app continues using AsyncStorage for user sessions
- **Database triggers updated**: Now handle mock user IDs gracefully without failing

## Future Production Considerations

For production deployment, you should:

1. **Implement real Supabase authentication**:
   - Replace mock auth with `supabase.auth.signUp()` and `supabase.auth.signIn()`
   - Remove AsyncStorage-based auth

2. **Re-enable RLS**:
   - Use the policies from `supabase/migrations/002_rls_policies.sql`
   - Test thoroughly with real authenticated users

3. **Update user ID references**:
   - Ensure all user IDs match Supabase auth.users table
   - Update foreign key constraints

## Troubleshooting

### If errors persist after migration:

1. **Verify migration was applied**:
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM chats WHERE match_id IS NOT NULL LIMIT 1;
   -- Should succeed without auth errors
   ```

2. **Check RLS status**:
   ```sql
   -- In Supabase SQL Editor
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('chats', 'chat_members', 'chat_messages');
   -- rowsecurity should be 'f' (false) for all
   ```

3. **Clear app cache**:
   ```bash
   npx expo start -c
   ```

4. **Check Supabase logs**:
   - Go to Supabase Dashboard > Logs
   - Look for any database errors

## Support

If issues persist, check:
- Supabase project is running
- Environment variables are correct in `.env`
- Network connection to Supabase is working
- Database migrations were applied successfully
