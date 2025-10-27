# 🚨 URGENT FIX: Database Table Name Mismatch

## Problem
The app code references the table `profiles`, but your Supabase database has a table named `players`. This causes the error:
```
Could not find the table 'public.players' in the schema cache
```

## Solution
Apply the migration file to rename `players` → `profiles`.

## Steps to Fix

### 1. Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: `mcgqjqkknmojspocvvxl`
3. Click on "SQL Editor" in the left sidebar

### 2. Run the Migration
1. Copy the ENTIRE contents of the file: `supabase/migrations/013_rename_players_to_profiles.sql`
2. Paste it into the SQL Editor
3. Click "Run" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

### 3. Verify the Fix
Run this query to verify the `profiles` table exists:
```sql
SELECT * FROM profiles LIMIT 5;
```

You should see your user profiles.

### 4. Restart the App
After applying the migration:
1. Stop your Expo dev server (if running)
2. Clear cache: `npx expo start --clear`
3. Reload the app on your device

## What This Migration Does
- ✅ Renames `players` table to `profiles`
- ✅ Updates all indexes and constraints
- ✅ Fixes RLS policies
- ✅ Updates trigger functions
- ✅ Recreates views with correct table name
- ✅ Ensures all required columns exist

## Need Help?
If you get any errors when running the migration, copy the error message and send it back to me.
