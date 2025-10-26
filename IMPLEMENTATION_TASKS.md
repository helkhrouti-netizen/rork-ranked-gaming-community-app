# Implementation Tasks Summary

## ✅ Completed Tasks

### 1. Language Translation System
- **Status**: COMPLETED
- **Changes Made**:
  - Updated `constants/translations.ts` to include translations for ALL UI strings
  - Changed phone number label from "Optional" to mandatory in both FR and EN
  - Added comprehensive translations for:
    - Home screen (match listings, quick match)
    - Match details and creation
    - Profile screen
    - Leaderboard
    - Tournaments
    - All tabs

### 2. Phone Number Validation (UI Only)
- **Status**: PARTIALLY COMPLETED
- **Changes Made**:
  - Added client-side validation in `app/auth/signup.tsx`
  - Phone number is now required with regex validation: `/^\+?[1-9]\d{1,14}$/`
  - Error messages guide users to correct format
  
- **⚠️ REMAINING WORK**: The AuthContext `signup` function currently only accepts 3 parameters (email, password, username). You need to:
  1. Update the `signup` function signature in `contexts/AuthContext.tsx` to accept a 4th parameter: `phoneNumber`
  2. Update the database insertion logic to save the phone number
  3. Ensure the profiles table allows/enforces the phone_number field

---

## 🔧 Pending Tasks

### 3. Database: Make Phone Number NOT NULL
**SQL Migration Required:**

```sql
-- File: supabase/migrations/007_phone_number_mandatory.sql

-- Add NOT NULL constraint to phone_number
ALTER TABLE public.profiles 
ALTER COLUMN phone_number SET NOT NULL;

-- Optional: Add unique constraint if phone numbers should be unique
-- ALTER TABLE public.profiles 
-- ADD CONSTRAINT profiles_phone_number_unique UNIQUE (phone_number);

-- Add a check constraint for phone number format (basic)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_phone_number_format 
CHECK (phone_number ~ '^\+?[1-9][0-9]{7,14}$');
```

### 4. Player Match History Table
**SQL Migration Required:**

```sql
-- File: supabase/migrations/008_player_match_history.sql

CREATE TABLE IF NOT EXISTS public.player_match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  rp_change INTEGER NOT NULL,
  rp_before INTEGER NOT NULL,
  rp_after INTEGER NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('official', 'friendly')),
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT player_match_unique UNIQUE (player_id, match_id)
);

-- Index for faster queries
CREATE INDEX idx_player_match_history_player_id ON public.player_match_history(player_id);
CREATE INDEX idx_player_match_history_played_at ON public.player_match_history(played_at DESC);

-- RLS Policies
ALTER TABLE public.player_match_history ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own match history
CREATE POLICY "Users can view own match history"
  ON public.player_match_history
  FOR SELECT
  USING (auth.uid() = player_id);

-- Allow system to insert match history
CREATE POLICY "System can insert match history"
  ON public.player_match_history
  FOR INSERT
  WITH CHECK (true);
```

### 5. Share Match Results Feature
**Implementation Required:**

1. **Install react-native-view-shot:**
```bash
bun expo install react-native-view-shot
```

2. **Create Share Results Component:**
```typescript
// File: components/ShareMatchResults.tsx

import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Share2, Instagram, Download, Copy } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { RANK_INFO } from '@/constants/ranks';

interface ShareMatchResultsProps {
  playerName: string;
  rank: { division: string; level: number; points: number };
  rpChange: number;
  matchResult: 'win' | 'loss';
  last5Games: ('W' | 'L')[];
}

export function ShareMatchResults({
  playerName,
  rank,
  rpChange,
  matchResult,
  last5Games
}: ShareMatchResultsProps) {
  const viewRef = useRef<View>(null);
  const rankInfo = RANK_INFO[rank.division];

  const captureAndShare = async (destination: 'instagram' | 'save' | 'share') => {
    try {
      if (!viewRef.current) return;
      
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (destination === 'instagram') {
        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(uri, {
            UTI: 'com.instagram.exclusivegram',
          });
        } else {
          await Share.share({
            message: `Check out my Padel match result!`,
            url: uri,
          });
        }
      } else if (destination === 'save') {
        const fileName = `padel_match_${Date.now()}.png`;
        const destUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: uri, to: destUri });
        alert('Image saved successfully!');
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share image');
    }
  };

  return (
    <View style={styles.container}>
      {/* Shareable Content */}
      <View ref={viewRef} style={styles.shareableContent} collapsable={false}>
        <LinearGradient
          colors={rankInfo.gradient}
          style={styles.gradient}
        >
          <Text style={styles.playerName}>{playerName}</Text>
          <View style={styles.rankBadge}>
            <Text style={styles.rankEmoji}>{rankInfo.icon}</Text>
            <Text style={styles.rankText}>{rank.division} {rank.level}</Text>
          </View>
          
          <View style={styles.rpChangeContainer}>
            <Text style={[styles.rpChange, { color: rpChange >= 0 ? '#10B981' : '#EF4444' }]}>
              {rpChange >= 0 ? '+' : ''}{rpChange} RP
            </Text>
            <Text style={styles.currentRP}>{rank.points} RP Total</Text>
          </View>

          <View style={styles.last5Container}>
            <Text style={styles.last5Title}>Last 5 Matches</Text>
            <View style={styles.last5Games}>
              {last5Games.map((result, i) => (
                <View
                  key={i}
                  style={[styles.gameDot, result === 'W' ? styles.winDot : styles.lossDot]}
                >
                  <Text style={styles.gameText}>{result}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Share Buttons */}
      <View style={styles.shareButtons}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => captureAndShare('instagram')}
        >
          <Instagram size={24} color={Colors.colors.textPrimary} />
          <Text style={styles.shareButtonText}>Story</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => captureAndShare('save')}
        >
          <Download size={24} color={Colors.colors.textPrimary} />
          <Text style={styles.shareButtonText}>Save</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => captureAndShare('share')}
        >
          <Share2 size={24} color={Colors.colors.textPrimary} />
          <Text style={styles.shareButtonText}>More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  shareableContent: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  gradient: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.colors.textPrimary,
    marginBottom: 20,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 30,
  },
  rankEmoji: {
    fontSize: 40,
  },
  rankText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.colors.textPrimary,
  },
  rpChangeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  rpChange: {
    fontSize: 48,
    fontWeight: '800',
  },
  currentRP: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
    marginTop: 8,
  },
  last5Container: {
    alignItems: 'center',
  },
  last5Title: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    marginBottom: 12,
  },
  last5Games: {
    flexDirection: 'row',
    gap: 8,
  },
  gameDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winDot: {
    backgroundColor: '#10B981',
  },
  lossDot: {
    backgroundColor: '#EF4444',
  },
  gameText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.colors.textPrimary,
  },
  shareButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareButton: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  shareButtonText: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
  },
});
```

3. **Add to Profile Screen:**
   - Import the ShareMatchResults component
   - Add a button to trigger the share modal
   - Fetch last 5 game results from player_match_history table

### 6. Rank Progress Bar Enhancement
**Already Implemented** ✅ - The progress bar exists in `app/(tabs)/profile.tsx` (lines 136-148), showing:
- Current RP
- Progress to next level
- RP needed

**Optional Enhancement:** Make it clickable to show a modal with detailed rank progression info.

### 7. Native Time Picker in Create Match
**Implementation Required:**

```typescript
// In app/match/create.tsx

import DateTimePicker from '@react-native-community/datetimepicker';

// Add to state:
const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
const [selectedTime, setSelectedTime] = useState<Date>(new Date());

// Replace the TextInput with:
<TouchableOpacity
  style={styles.inputGroup}
  onPress={() => setShowTimePicker(true)}
>
  <View style={styles.inputIcon}>
    <Clock color={Colors.colors.primary} size={20} strokeWidth={2.5} />
  </View>
  <View style={styles.inputContent}>
    <Text style={styles.inputLabel}>Scheduled Time (Optional)</Text>
    <Text style={styles.inputValue}>
      {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </Text>
  </View>
</TouchableOpacity>

{showTimePicker && (
  <DateTimePicker
    value={selectedTime}
    mode="time"
    display="spinner"
    onChange={(event, date) => {
      setShowTimePicker(Platform.OS === 'ios');
      if (date) {
        setSelectedTime(date);
        setScheduledTime(date.toISOString());
      }
    }}
  />
)}
```

**Install DateTimePicker:**
```bash
bun expo install @react-native-community/datetimepicker
```

### 8. Show Host Phone Number to Match Participants
**SQL RLS Policy Required:**

```sql
-- File: supabase/migrations/009_host_phone_visibility.sql

-- Create a policy that allows match participants to view host phone number
CREATE POLICY "Match participants can view host phone"
  ON public.profiles
  FOR SELECT
  USING (
    -- User can always see their own phone
    auth.uid() = id
    OR
    -- User can see phone of hosts in matches they've joined
    id IN (
      SELECT m.host_id
      FROM public.matches m
      JOIN public.match_participants mp ON m.id = mp.match_id
      WHERE mp.player_id = auth.uid()
        AND m.status IN ('waiting', 'in_progress')
    )
  );
```

**UI Implementation:**

In `app/match/[id].tsx`, add the phone number display:

```typescript
// Add to the host card section (after line 255):
{hasJoined && match.host.phone_number && (
  <View style={styles.hostPhoneContainer}>
    <Phone color={Colors.colors.primary} size={16} />
    <Text style={styles.hostPhoneLabel}>{t.match.hostPhoneNumber}:</Text>
    <Text style={styles.hostPhoneNumber}>{match.host.phone_number}</Text>
  </View>
)}

// Add styles:
hostPhoneContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginTop: 12,
  padding: 12,
  backgroundColor: Colors.colors.surfaceLight,
  borderRadius: 8,
},
hostPhoneLabel: {
  fontSize: 12,
  color: Colors.colors.textSecondary,
},
hostPhoneNumber: {
  fontSize: 14,
  fontWeight: '600',
  color: Colors.colors.primary,
},
```

---

## Summary

### ✅ Fully Completed:
1. Language translation system - ALL strings translated
2. Phone number UI validation

### ⚠️ Needs Code Changes:
3. Update AuthContext signup function to accept phone_number parameter
4. Install and implement react-native-view-shot for match results sharing
5. Install and implement DateTimePicker for match scheduling

### 📝 Needs Database Migrations:
6. Make phone_number NOT NULL in profiles table
7. Create player_match_history table
8. Add RLS policy for host phone number visibility

---

## Testing Checklist

- [ ] Switch language between FR/EN - all text should change
- [ ] Try to sign up without phone number - should show error
- [ ] Try to sign up with invalid phone format - should show error
- [ ] Successfully sign up with valid phone number
- [ ] Create match and use time picker to select time
- [ ] Join a match and verify host phone number is visible
- [ ] Finish a match and share results as image
- [ ] Click on rank in profile - progress bar should show RP details
