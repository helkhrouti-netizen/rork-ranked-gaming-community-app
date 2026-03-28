-- Create player_match_history table
CREATE TABLE IF NOT EXISTS public.player_match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL,
  rp_change INT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('win', 'loss', 'draw')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_player_match_history_player_id ON public.player_match_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_match_history_match_id ON public.player_match_history(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_history_created_at ON public.player_match_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.player_match_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can read their own match history
CREATE POLICY "Users can view their own match history"
  ON public.player_match_history
  FOR SELECT
  USING (auth.uid() = player_id);

-- RLS Policy: Allow authenticated users to insert their own match history
CREATE POLICY "Users can insert their own match history"
  ON public.player_match_history
  FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- RLS Policy: Users can update their own match history
CREATE POLICY "Users can update their own match history"
  ON public.player_match_history
  FOR UPDATE
  USING (auth.uid() = player_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_player_match_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_player_match_history_updated_at_trigger
  BEFORE UPDATE ON public.player_match_history
  FOR EACH ROW
  EXECUTE FUNCTION update_player_match_history_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.player_match_history TO authenticated;
