# Fix Chat RLS Error

## Problem
The error "new row violates row-level security policy for table 'chats'" occurs because:

1. **The app uses mock authentication** (stored in AsyncStorage, not real Supabase auth)
2. **Supabase RLS policies** check `auth.uid()` which returns `null` for unauthenticated users
3. **Chat messages can't be inserted** because the policy requires `auth.uid() = sender_id`

## Solution

### Apply the Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Disable RLS for chat tables (development only)
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
```

Or apply the migration file:
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/005_disable_rls_for_dev.sql`
3. Paste and run it

### Alternative: Use Service Role Key (More Secure)

If you want to keep RLS enabled but bypass it from your app:

1. Get your Supabase **Service Role Key** from the Supabase Dashboard (Settings → API)
2. Add it to your `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```
3. Update `lib/supabase.ts` to use the service key for certain operations

## For Production

For production, you should:
1. **Implement real Supabase authentication** instead of mock auth
2. **Re-enable RLS** with proper policies
3. **Sign users in with Supabase** so `auth.uid()` returns their actual user ID

## Quick Test

After applying the migration:
1. Restart your app
2. Join a match
3. Open the match chat
4. Send a message
5. It should now work without RLS errors!
