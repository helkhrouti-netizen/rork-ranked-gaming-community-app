# Supabase Setup Guide

Your app is now configured to use Supabase! Follow these steps to complete the setup:

## ✅ Completed

1. ✅ Supabase client initialized (`lib/supabase.ts`)
2. ✅ Environment variables configured (`.env`)
3. ✅ Supabase auth context created (`contexts/SupabaseAuthContext.tsx`)
4. ✅ Supabase profile service created (`services/supabaseProfile.ts`)
5. ✅ Auth screens updated to use Supabase
6. ✅ Onboarding flow updated to save to Supabase

## 🔧 Next Steps

### Step 1: Run the SQL Schema

Open your Supabase project at https://mcgqjqkknmojspocvvxl.supabase.co

1. Go to the **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql` into the editor
4. Click **Run** to execute the schema

This will create:
- `profiles` table with user information
- `matches` table for game matches
- `match_players` junction table
- Row Level Security (RLS) policies
- Indexes for performance
- Automatic profile creation trigger

### Step 2: Test the App

1. Start your app: `npm start` or `bun start`
2. Sign up with a new account
3. Complete the onboarding process
4. Your profile should be saved to Supabase!

### Step 3: Verify in Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. Check the `profiles` table
3. You should see your user profile with:
   - username
   - avatar_uri
   - city
   - rank_tier, rank_sub
   - rp (ranking points)
   - onboarding_completed = true

## 📋 Database Schema

### profiles table
- `id` (UUID, primary key, references auth.users)
- `username` (TEXT)
- `avatar_uri` (TEXT)
- `city` (TEXT)
- `rank_tier` (TEXT) - Cuivre, Silver, Gold, or Platinum
- `rank_sub` (INTEGER) - 1, 2, or 3
- `rp` (INTEGER) - Ranking points
- `wins` (INTEGER)
- `losses` (INTEGER)
- `reputation` (DECIMAL)
- `level` (INTEGER)
- `onboarding_completed` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### matches table
- `id` (UUID, primary key)
- `type` (TEXT) - 'official' or 'friendly'
- `status` (TEXT) - 'waiting', 'in_progress', 'completed'
- `host_id` (UUID, references profiles)
- `max_players` (INTEGER)
- `field` (JSONB) - Field information
- `point_reward` (INTEGER)
- `point_penalty` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### match_players table
- `match_id` (UUID, references matches)
- `player_id` (UUID, references profiles)
- `joined_at` (TIMESTAMP)

## 🔐 Security

Row Level Security (RLS) is enabled on all tables:

- **profiles**: Users can only view/update their own profile
- **matches**: Anyone can view, only host can update
- **match_players**: Anyone can view, users can join/leave

## 🚀 What's Working

- ✅ Sign up / Login with Supabase Auth
- ✅ Onboarding flow saves to Supabase
- ✅ Profile data persisted in Supabase
- ✅ Auth state management
- ✅ Automatic profile creation on signup

## 📝 Environment Variables

Your app uses these Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://mcgqjqkknmojspocvvxl.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These are stored in:
- `.env` file (for development)
- `app.json` extra config (for Expo)

## 🔄 Migration from Mock Data

The app has been migrated from mock data to Supabase:

- **Before**: `UserProfileContext` + `MockProfileService`
- **After**: `SupabaseAuthProvider` + `SupabaseProfileService`

## 🐛 Troubleshooting

### "No authenticated user found"
- Make sure you're logged in
- Check Supabase dashboard → Authentication → Users

### "Profile not found"
- Run the SQL schema to create the trigger
- The trigger automatically creates a profile when a user signs up

### "Permission denied"
- Check RLS policies in Supabase
- Make sure the user is authenticated

### Connection errors
- Verify the Supabase URL and anon key in `.env`
- Check your internet connection
- Verify the Supabase project is not paused

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🎉 You're All Set!

Once you run the SQL schema, your app will be fully connected to Supabase and ready to use!
