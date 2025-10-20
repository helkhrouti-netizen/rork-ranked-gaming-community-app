# Supabase Setup Instructions

## Environment Variables

Add the following environment variables to your project:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project settings under API.

## Database Setup

### 1. Create Users Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### 2. Enable Email Confirmation

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Email Templates
3. Make sure "Confirm signup" is enabled
4. Customize the email template if desired

### 3. Configure Email Settings

1. Go to Authentication → Settings
2. Under "Email Auth", ensure:
   - Enable email signup is ON
   - Enable email confirmations is ON
   - Double confirm email changes is ON (optional, for security)

## How It Works

### Signup Flow
1. User enters email, password, username, and optional phone number
2. Supabase creates an auth user with email confirmation required
3. User data is stored in the `users` table
4. Confirmation email is sent to the user
5. User must click the confirmation link in their email

### Login Flow
1. User enters email and password
2. System checks if email is confirmed
3. If not confirmed, user is redirected to check their inbox
4. If confirmed, user is logged in and can access the app

### Security Features
- Email confirmation required before login
- Passwords are securely hashed by Supabase
- Row Level Security (RLS) ensures users can only access their own data
- Phone numbers are optional and stored securely
- Only verified users can log in

## Testing

1. Sign up with a valid email address
2. Check your inbox for the confirmation email
3. Click the confirmation link
4. Log in with your credentials
5. Complete the onboarding process

## Troubleshooting

### Not receiving emails?
- Check your spam folder
- Verify your Supabase email settings
- Make sure your email provider allows emails from Supabase
- Check Supabase logs for email sending errors

### Login issues?
- Ensure email is confirmed before logging in
- Check that environment variables are set correctly
- Verify database table exists and RLS policies are correct
- Check console logs for detailed error messages
