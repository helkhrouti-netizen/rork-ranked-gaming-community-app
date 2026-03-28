# 🚨 CRITICAL FIX: Players Table → Profiles Table

## Issue
The app is stuck at loading with error: `Could not find the table 'public.players' in the schema cache`

## Root Cause
SQL migration files created database views (`match_details` and `leaderboard`) that reference a non-existent `players` table. The correct table name is `profiles`.

## Solution Applied
Created migration file: `supabase/migrations/011_fix_players_to_profiles.sql`

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/011_fix_players_to_profiles.sql`
4. Click **Run**
5. Verify the views are created by running:
   ```sql
   SELECT * FROM match_details LIMIT 1;
   SELECT * FROM leaderboard LIMIT 5;
   ```

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push

# Or apply the migration directly
supabase migration up
```

## Verification Steps
After applying the migration:

1. **Test the views:**
   ```sql
   -- This should work without errors
   SELECT * FROM match_details LIMIT 1;
   SELECT * FROM leaderboard LIMIT 5;
   ```

2. **Restart your app:**
   ```bash
   # Stop the current dev server (Ctrl+C)
   
   # Clear cache and restart
   npx expo start --clear
   ```

3. **Uninstall and reinstall the app on your device**
   - Delete the app from your device
   - Scan the QR code again to reinstall

## What Changed
- `match_details` view now joins `matches` with `profiles` (not `players`)
- `leaderboard` view now selects from `profiles` (not `players`)

## Expected Result
After applying this fix and restarting:
- ✅ App should load successfully
- ✅ Login should work without "table not found" errors
- ✅ Profile data should load correctly
