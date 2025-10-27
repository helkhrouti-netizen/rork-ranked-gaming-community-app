-- Add rank restriction columns to matches table
-- This allows match hosts to limit who can join based on rank

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS min_rank TEXT,
ADD COLUMN IF NOT EXISTS max_rank TEXT,
ADD COLUMN IF NOT EXISTS is_rank_open BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN matches.min_rank IS 'Minimum rank required to join (e.g., "Cuivre 1", "Silver 2")';
COMMENT ON COLUMN matches.max_rank IS 'Maximum rank allowed to join (e.g., "Gold 3", "Platinum 1")';
COMMENT ON COLUMN matches.is_rank_open IS 'If true, match is open to all ranks regardless of min/max settings';

-- Create an index for filtering matches by rank restrictions
CREATE INDEX IF NOT EXISTS idx_matches_is_rank_open ON matches(is_rank_open);
