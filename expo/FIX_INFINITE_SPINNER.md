# Fix: Infinite Spinner on Match Screens

## Problem
The app shows infinite spinners on:
- Quick Match button
- View Match screen
- Create Match screen

## Root Cause
Profile is not being created properly after signup, causing queries to hang or fail silently.

## Solution

### Step 1: Run SQL Migration in Supabase

1. Go to your Supabase Dashboard → SQL Editor
2. Run the file: `supabase/migrations/019_fix_profile_auto_creation.sql`
3. This will:
   - Ensure the `profiles` table has all required columns
   - Recreate the `public_profiles` view
   - Fix the auto-profile creation trigger
   - Set up proper RLS policies

### Step 2: Run Diagnostics in Supabase (Optional)

To check if the migration worked:

1. Open `supabase/diagnostics.sql` in your Supabase SQL Editor
2. Run it to see the current state of your database
3. Verify:
   - `profiles` table exists with all columns
   - `public_profiles` view exists
   - `handle_new_user` trigger function exists
   - `on_auth_user_created` trigger is active

### Step 3: Test in the App

1. Open the app and navigate to `/test-supabase`
2. Tap "Run Tests" 
3. Check for any errors
4. All checks should show ✅ (green checkmarks)

### Step 4: Try Signing Up Again

1. Sign out if you're logged in
2. Try creating a new account with a different email
3. After signup, you should:
   - See the onboarding screen (not infinite spinner)
   - Be able to complete onboarding
   - Access the app normally

## What Changed

### AuthContext (`contexts/AuthContext.tsx`)

**Before:**
- Would throw errors and stop execution if profile didn't exist
- Used `.single()` which required exactly one result

**After:**
- Returns `null` gracefully if profile doesn't exist yet
- Uses `.maybeSingle()` which allows 0 or 1 results
- Waits 2 seconds after signup for trigger to create profile
- Only updates username/phone after profile is created by trigger
- Handles timeout errors gracefully without crashing

### Database Trigger (`019_fix_profile_auto_creation.sql`)

**Before:**
- Only inserted `id` and `email`
- Profile might not have all required fields

**After:**
- Auto-creates profile with ALL required fields on signup:
  - `id`, `email`, `username` (from metadata or default 'User')
  - `level_score: 0`, `level_tier: 'Cuivre'`
  - `wins: 0`, `losses: 0`, `reputation: 5.0`
- Profile is immediately queryable after signup

## Common Issues

### "Profile not found" after signup
- **Cause**: Trigger didn't run or RLS policies block it
- **Fix**: Run the migration again, then test with a new email

### "Cannot coerce result to single JSON object"
- **Cause**: Using `.single()` when no profile exists
- **Fix**: Already fixed in updated AuthContext (uses `.maybeSingle()`)

### Matches screen still spinning
- **Cause**: Profile exists but matches query is failing
- **Fix**: Check RLS policies on `matches` table in Supabase Dashboard

### Quick Match creates match but doesn't navigate
- **Cause**: Router not working or match creation failed
- **Fix**: Check console logs for errors

## Testing Checklist

- [ ] Run migration `019_fix_profile_auto_creation.sql`
- [ ] Run diagnostics `supabase/diagnostics.sql` (verify setup)
- [ ] Sign up with new email
- [ ] Complete onboarding
- [ ] Create a match
- [ ] View a match
- [ ] Try Quick Match
- [ ] All screens load without infinite spinners

## Debug Logs to Check

When testing, watch for these console logs:

✅ **Good logs:**
```
✅ Signup successful
⏳ Waiting 2s for trigger to create profile...
📝 Updating profile with username and phone...
✅ Profile updated successfully
```

❌ **Bad logs:**
```
❌ Profile update warning: [error message]
⏱️ Profile load timed out after 10s
❌ Error loading user profile: [error]
```

## If Still Not Working

1. Check `.env` file has correct Supabase URL and Anon Key
2. Navigate to `/test-supabase` and run full diagnostics
3. Check Supabase Dashboard → Authentication → Users (should see new users)
4. Check Supabase Dashboard → Table Editor → profiles (should see profiles with data)
5. Check RLS policies are enabled and correct

## Support

If the issue persists after following all steps:
1. Run `/test-supabase` and take screenshot
2. Check browser/Metro console for errors
3. Share console logs and diagnostic results
