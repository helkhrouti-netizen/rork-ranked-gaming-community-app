# Share Match Results - Quick Reference

## 🗄️ Database Setup (REQUIRED FIRST STEP)

### Copy & Paste this SQL into Supabase Studio:

```sql
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_player_match_history_player_id ON public.player_match_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_match_history_match_id ON public.player_match_history(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_history_created_at ON public.player_match_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.player_match_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own match history"
  ON public.player_match_history FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own match history"
  ON public.player_match_history FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own match history"
  ON public.player_match_history FOR UPDATE
  USING (auth.uid() = player_id);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_player_match_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_match_history_updated_at_trigger
  BEFORE UPDATE ON public.player_match_history
  FOR EACH ROW
  EXECUTE FUNCTION update_player_match_history_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.player_match_history TO authenticated;
```

## 📦 Files Created

### Components
- ✅ `components/ShareMatchResults.tsx` - Main share modal
- ✅ `components/ShareMatchResultsDemo.tsx` - Example wrapper

### Services
- ✅ `services/matchHistory.ts` - Database operations

### Types
- ✅ Updated `types/index.ts` with `PlayerMatchHistory`

### Documentation
- ✅ `SHARE_MATCH_RESULTS_GUIDE.md` - Full guide
- ✅ `SHARE_RESULTS_EXAMPLE.tsx` - Code examples
- ✅ `SHARE_FEATURE_SUMMARY.md` - Overview
- ✅ `QUICK_REFERENCE.md` - This file

## 🚀 Quick Integration

### 1. Import the component
```tsx
import ShareMatchResults from '@/components/ShareMatchResults';
import { matchHistoryService } from '@/services/matchHistory';
```

### 2. Add to your screen
```tsx
const [showShare, setShowShare] = useState(false);

// Button to trigger
<TouchableOpacity onPress={() => setShowShare(true)}>
  <Text>Share Results</Text>
</TouchableOpacity>

// Modal
<ShareMatchResults
  visible={showShare}
  onClose={() => setShowShare(false)}
  playerName="John Doe"
  currentRank={{ division: 'Gold', level: 2, points: 550 }}
  currentRP={550}
  rpChange={50}
  matchOutcome="win"
  recentMatches={[
    { id: '1', outcome: 'win', rpChange: 50, date: new Date() },
    { id: '2', outcome: 'loss', rpChange: -25, date: new Date() },
    { id: '3', outcome: 'win', rpChange: 50, date: new Date() },
    { id: '4', outcome: 'win', rpChange: 50, date: new Date() },
    { id: '5', outcome: 'loss', rpChange: -25, date: new Date() },
  ]}
/>
```

### 3. Record match result (after validation)
```tsx
import { matchHistoryService } from '@/services/matchHistory';
import { getRPChangeForMatch } from '@/constants/ranks';

// Calculate RP change
const rpChange = getRPChangeForMatch(
  'official', // or 'friendly'
  'win',      // or 'loss' or 'draw'
  currentRP
);

// Save to database
await matchHistoryService.recordMatchResult(
  playerId,
  matchId,
  'win',
  rpChange
);
```

### 4. Fetch match history
```tsx
// Get last 5 matches
const history = await matchHistoryService.getPlayerMatchHistory(playerId, 5);

// Format for sharing
const formatted = await matchHistoryService.getMatchHistoryForShare(playerId);
```

## 📱 Sharing Options

The component provides 4 sharing actions:

1. **Save as PNG** - Saves to device gallery
2. **Copy** - Copies image to clipboard (mobile only)
3. **Instagram** - Opens Instagram share
4. **More** - System share sheet with all options

## 🎨 Visual Features

- ✨ Rank-specific gradient backgrounds
- 🎯 Match outcome with RP change
- 📊 Last 5 matches as colored dots
  - 🟢 Green = Win
  - 🔴 Red = Loss
  - 🟡 Yellow = Draw
- 📈 Win/Loss record
- 🏷️ "Padel League" branding

## 📋 Common Patterns

### Pattern 1: After Match
```tsx
// After score validation
const handleMatchComplete = async () => {
  // 1. Calculate RP
  const rpChange = getRPChangeForMatch(matchType, outcome, currentRP);
  
  // 2. Update player RP
  await updatePlayerRP(playerId, currentRP + rpChange);
  
  // 3. Record to history
  await matchHistoryService.recordMatchResult(playerId, matchId, outcome, rpChange);
  
  // 4. Show share modal
  setShowShare(true);
};
```

### Pattern 2: Profile Stats
```tsx
// Load history and show share
const handleShareStats = async () => {
  const history = await matchHistoryService.getMatchHistoryForShare(playerId);
  setMatchHistory(history);
  setShowShare(true);
};
```

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Image not capturing | Check console, verify react-native-view-shot installed |
| Can't save to gallery | Request media library permissions |
| Share not working on web | Use "Save as PNG" instead |
| Database error | Verify migration was applied |

## ✅ Checklist

- [ ] Run SQL migration in Supabase
- [ ] Import ShareMatchResults component
- [ ] Add share button to UI
- [ ] Record match results to database
- [ ] Test on real device
- [ ] Verify permissions work
- [ ] Test all sharing options

## 📚 Full Documentation

See these files for more details:
- `SHARE_MATCH_RESULTS_GUIDE.md` - Complete implementation guide
- `SHARE_RESULTS_EXAMPLE.tsx` - Detailed code examples

## 💾 Dependencies

Already installed:
- ✅ `react-native-view-shot`
- ✅ `expo-media-library`
- ✅ `expo-clipboard`

---

**Ready to use!** 🚀
