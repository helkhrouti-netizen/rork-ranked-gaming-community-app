-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  avatar_uri TEXT,
  city TEXT,
  rank_tier TEXT,
  rank_sub INTEGER,
  rp INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  reputation DECIMAL DEFAULT 5.0,
  level INTEGER DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'waiting',
  host_id UUID REFERENCES profiles(id) NOT NULL,
  max_players INTEGER DEFAULT 4,
  field JSONB,
  point_reward INTEGER DEFAULT 25,
  point_penalty INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policies for matches
CREATE POLICY "Anyone can view matches"
  ON matches
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create matches"
  ON matches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update their matches"
  ON matches
  FOR UPDATE
  USING (auth.uid() = host_id);

-- Create match_players junction table
CREATE TABLE IF NOT EXISTS match_players (
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (match_id, player_id)
);

-- Enable Row Level Security for match_players
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

-- Create policies for match_players
CREATE POLICY "Anyone can view match players"
  ON match_players
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join matches"
  ON match_players
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can leave matches"
  ON match_players
  FOR DELETE
  TO authenticated
  USING (auth.uid() = player_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at)
  VALUES (NEW.id, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_host_id ON matches(host_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);
