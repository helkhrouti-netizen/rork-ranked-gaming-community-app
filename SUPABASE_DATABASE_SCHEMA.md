# Supabase Database Schema

This document describes the required database schema for the Rork Padel app.

## Tables

### 1. users

Stores user profile information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  phone_number TEXT,
  profile_picture TEXT,
  city TEXT,
  rank JSONB DEFAULT '{"division": "Cuivre", "level": 1, "points": 0}'::jsonb,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  reputation REAL DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_rank_points ON users((rank->>'points'));
CREATE INDEX idx_users_city ON users(city);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### Fields:
- `id` (UUID, PK): User unique identifier, references auth.users
- `email` (TEXT): User email address
- `username` (TEXT): Display name
- `phone_number` (TEXT): Optional phone number
- `profile_picture` (TEXT): URL to profile image
- `city` (TEXT): User's city
- `rank` (JSONB): User's rank with structure: `{"division": "Cuivre", "level": 1, "points": 0}`
- `wins` (INTEGER): Total wins
- `losses` (INTEGER): Total losses
- `reputation` (REAL): User reputation score
- `level` (INTEGER): User level
- `created_at` (TIMESTAMPTZ): Account creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

---

### 2. matches

Stores match information.

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('official', 'friendly')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'pending_validation', 'disputed')),
  max_players INTEGER NOT NULL DEFAULT 4,
  field JSONB NOT NULL,
  scheduled_time TIMESTAMPTZ,
  point_reward INTEGER NOT NULL DEFAULT 50,
  point_penalty INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_matches_host_id ON matches(host_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_type ON matches(type);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);

-- Enable Row Level Security
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update own matches" ON matches
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Host can delete own matches" ON matches
  FOR DELETE USING (auth.uid() = host_id);
```

#### Fields:
- `id` (UUID, PK): Match unique identifier
- `host_id` (UUID, FK): References users.id
- `type` (TEXT): 'official' or 'friendly'
- `status` (TEXT): 'waiting', 'in_progress', 'completed', 'pending_validation', 'disputed'
- `max_players` (INTEGER): Maximum number of players
- `field` (JSONB): Field information: `{"name": "Field Name", "address": "Address", "city": "CASABLANCA"}`
- `scheduled_time` (TIMESTAMPTZ): When the match is scheduled
- `point_reward` (INTEGER): RP reward for winning
- `point_penalty` (INTEGER): RP penalty for losing
- `created_at` (TIMESTAMPTZ): Match creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

---

### 3. match_players

Junction table for match participants.

```sql
CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Create indexes
CREATE INDEX idx_match_players_match_id ON match_players(match_id);
CREATE INDEX idx_match_players_user_id ON match_players(user_id);

-- Enable Row Level Security
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view match players" ON match_players
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join matches" ON match_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave matches" ON match_players
  FOR DELETE USING (auth.uid() = user_id);
```

#### Fields:
- `id` (UUID, PK): Unique identifier
- `match_id` (UUID, FK): References matches.id
- `user_id` (UUID, FK): References users.id
- `joined_at` (TIMESTAMPTZ): When player joined

---

## Database Functions

### Update timestamp function

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Realtime Subscriptions

Enable realtime for relevant tables:

```sql
-- Enable realtime for users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Enable realtime for matches table
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Enable realtime for match_players table
ALTER PUBLICATION supabase_realtime ADD TABLE match_players;
```

---

## Example Queries

### Get all matches with host and players

```sql
SELECT 
  m.*,
  json_build_object(
    'id', host.id,
    'username', host.username,
    'rank', host.rank
  ) as host,
  (
    SELECT json_agg(
      json_build_object(
        'id', u.id,
        'username', u.username,
        'rank', u.rank
      )
    )
    FROM match_players mp
    JOIN users u ON u.id = mp.user_id
    WHERE mp.match_id = m.id
  ) as players
FROM matches m
JOIN users host ON host.id = m.host_id
ORDER BY m.created_at DESC;
```

### Get leaderboard sorted by rank points

```sql
SELECT 
  id,
  username,
  rank,
  wins,
  losses,
  reputation,
  level
FROM users
ORDER BY (rank->>'points')::integer DESC
LIMIT 100;
```

### Get players by specific rank

```sql
-- Get all Cuivre 1 players
SELECT *
FROM users
WHERE rank->>'division' = 'Cuivre'
  AND (rank->>'level')::integer = 1
ORDER BY (rank->>'points')::integer DESC;
```

---

## Initial Data Setup

### Insert test user (after signup)

After a user signs up through Supabase Auth, update their profile:

```sql
UPDATE users
SET 
  username = 'TestPlayer',
  city = 'CASABLANCA',
  rank = '{"division": "Cuivre", "level": 1, "points": 50}'::jsonb,
  wins = 0,
  losses = 0,
  reputation = 0,
  level = 1
WHERE id = '<user_id>';
```

### Create a test match

```sql
INSERT INTO matches (host_id, type, status, max_players, field, point_reward, point_penalty)
VALUES (
  '<user_id>',
  'official',
  'waiting',
  4,
  '{"name": "Padel Club Casa", "address": "123 Rue Test", "city": "CASABLANCA"}'::jsonb,
  50,
  30
);
```

---

## Important Notes

1. **Auth Integration**: The `users` table is linked to Supabase Auth's `auth.users` table via the `id` field.

2. **JSONB Fields**: 
   - `rank` stores complex rank data
   - `field` stores match location details
   
3. **Row Level Security**: All tables have RLS enabled for security.

4. **Realtime**: Tables are configured for realtime subscriptions to automatically update the UI.

5. **Foreign Keys**: Proper CASCADE rules ensure data integrity.

6. **Indexes**: Performance indexes are added for common queries.
