# Share Match Results Feature - Implementation Guide

## Overview
This feature allows players to share their match results as beautiful, shareable images containing:
- Player name
- Current rank and RP
- Match outcome (win/loss/draw)
- RP change
- Last 5 match history with visual indicators
- Rank-specific gradient backgrounds

## Database Setup

### 1. SQL Migration
The migration file `supabase/migrations/008_player_match_history.sql` has been created with:

**Table: `public.player_match_history`**
- `id` (UUID, Primary Key)
- `player_id` (UUID, Foreign Key to auth.users)
- `match_id` (UUID)
- `rp_change` (INT) - The RP gained or lost
- `outcome` (TEXT) - 'win', 'loss', or 'draw'
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can view their own match history
- Users can insert their own match history
- Users can update their own match history

**To apply the migration:**
```bash
# If using Supabase CLI
supabase db push

# Or run the SQL directly in Supabase Studio SQL Editor
```

## Components

### ShareMatchResults Component
Location: `components/ShareMatchResults.tsx`

**Features:**
- Modal-based UI for sharing
- Live preview of the shareable image
- Uses `react-native-view-shot` to capture the UI as PNG
- Multiple sharing options:
  - Save as PNG to gallery
  - Copy to clipboard
  - Share to Instagram Story
  - Share via system share sheet (more options)

**Props:**
```typescript
interface ShareMatchResultsProps {
  visible: boolean;
  onClose: () => void;
  playerName: string;
  currentRank: Rank;
  currentRP: number;
  rpChange: number;
  matchOutcome: 'win' | 'loss' | 'draw';
  recentMatches: MatchHistoryRecord[];
}
```

### ShareMatchResultsDemo Component
Location: `components/ShareMatchResultsDemo.tsx`

A simple wrapper component showing how to integrate the share feature.

## Usage Example

### 1. After Match Completion
In your match result submission screen (e.g., `app/match/result/[id].tsx`):

```tsx
import ShareMatchResultsDemo from '@/components/ShareMatchResultsDemo';
import { useUserProfile } from '@/contexts/UserProfileContext';

// Inside your component
const { profile } = useUserProfile();

// After match is validated
<ShareMatchResultsDemo
  playerName={profile?.username || 'Player'}
  currentRank={profile?.rank || { division: 'Cuivre', level: 1, points: 0 }}
  currentRP={profile?.rank.points || 0}
  rpChange={50} // Calculate based on match outcome
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

### 2. In Profile Screen
In `app/(tabs)/profile.tsx`, you can add a share button:

```tsx
import { useState } from 'react';
import ShareMatchResults from '@/components/ShareMatchResults';

const [showShareModal, setShowShareModal] = useState(false);

// Add button in your UI
<TouchableOpacity onPress={() => setShowShareModal(true)}>
  <Text>Share My Stats</Text>
</TouchableOpacity>

// Add modal
<ShareMatchResults
  visible={showShareModal}
  onClose={() => setShowShareModal(false)}
  playerName={profile.username}
  currentRank={profile.rank}
  currentRP={profile.rank.points}
  rpChange={0} // Or last match RP change
  matchOutcome="win" // Or last match outcome
  recentMatches={lastFiveMatches}
/>
```

## Fetching Match History Data

### Using Supabase

```typescript
// In a service file (e.g., services/matchHistory.ts)
import { supabase } from '@/lib/supabase';

export const matchHistoryService = {
  async getPlayerMatchHistory(playerId: string, limit = 5) {
    const { data, error } = await supabase
      .from('player_match_history')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching match history:', error);
      throw error;
    }

    return data;
  },

  async recordMatchResult(
    playerId: string,
    matchId: string,
    outcome: 'win' | 'loss' | 'draw',
    rpChange: number
  ) {
    const { data, error } = await supabase
      .from('player_match_history')
      .insert({
        player_id: playerId,
        match_id: matchId,
        outcome,
        rp_change: rpChange,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording match result:', error);
      throw error;
    }

    return data;
  },
};
```

### Using React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Hook to fetch match history
export function useMatchHistory(playerId: string) {
  return useQuery({
    queryKey: ['matchHistory', playerId],
    queryFn: () => matchHistoryService.getPlayerMatchHistory(playerId, 5),
    enabled: !!playerId,
  });
}

// Hook to record match result
export function useRecordMatchResult() {
  return useMutation({
    mutationFn: (params: {
      playerId: string;
      matchId: string;
      outcome: 'win' | 'loss' | 'draw';
      rpChange: number;
    }) => matchHistoryService.recordMatchResult(
      params.playerId,
      params.matchId,
      params.outcome,
      params.rpChange
    ),
  });
}
```

## Integration Workflow

### Complete Match Flow

1. **Match Ends** → Players submit scores
2. **Score Validation** → System validates (3/4 agreement)
3. **Calculate RP Changes** → Use `getRPChangeForMatch()` from `constants/ranks.ts`
4. **Update Player RP** → Update profile in database
5. **Record Match History** → Insert into `player_match_history` table
6. **Show Share Option** → Display `ShareMatchResults` component

### Example Implementation

```typescript
// In your match result validation function
const handleMatchValidated = async (
  matchId: string,
  team1Score: number,
  team2Score: number,
  players: Player[]
) => {
  // Determine winners and losers
  const team1Won = team1Score > team2Score;
  
  for (const player of players) {
    const isWinner = /* determine if player is in winning team */;
    const outcome = isWinner ? 'win' : 'loss';
    const rpChange = getRPChangeForMatch(
      matchType, // 'official' or 'friendly'
      outcome,
      player.rank.points
    );

    // Update player RP
    await updatePlayerRP(player.id, player.rank.points + rpChange);

    // Record in match history
    await matchHistoryService.recordMatchResult(
      player.id,
      matchId,
      outcome,
      rpChange
    );
  }

  // Show share modal for current player
  setShowShareModal(true);
};
```

## Permissions

The component requires these permissions:

1. **Media Library** (for saving to gallery)
   - iOS: `NSPhotoLibraryAddUsageDescription` in app.json
   - Android: Handled automatically by expo-media-library

2. **Clipboard** (for copying images)
   - Handled by expo-clipboard

Add to `app.json` if needed:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSPhotoLibraryAddUsageDescription": "Allow Padel League to save match results to your photo library"
      }
    }
  }
}
```

## Dependencies Installed

- `react-native-view-shot` - Captures React Native views as images
- `expo-media-library` - Saves images to device gallery

## Design Features

- Rank-specific gradient backgrounds using colors from `constants/ranks.ts`
- Last 5 matches shown as colored dots (green = win, red = loss, yellow = draw)
- Win/loss record display
- Dynamic coloring based on outcome
- Shadow effects for better visual appeal
- Branding footer with "Padel League"

## Platform Support

- ✅ iOS - Full support
- ✅ Android - Full support
- ⚠️ Web - Partial support (clipboard image copy not available)

## Testing

To test the feature:

1. Complete a match
2. Validate the score
3. Click "Share Results"
4. Try each sharing option:
   - Save as PNG
   - Copy to clipboard
   - Share to Instagram
   - Use system share sheet

## Troubleshooting

**Issue: Image not capturing**
- Ensure `ViewShot` ref is attached
- Check console for errors
- Verify `react-native-view-shot` is installed

**Issue: Can't save to gallery**
- Request media library permissions
- Check permissions in device settings

**Issue: Share not working on web**
- Use "Save as PNG" option instead
- Web has limited clipboard API support

## Future Enhancements

- Add transparent background option
- Custom background patterns
- Additional stats (total wins, win streak, etc.)
- Social media templates (Instagram Story dimensions, etc.)
- Animation effects on the shareable card
- QR code linking to player profile
