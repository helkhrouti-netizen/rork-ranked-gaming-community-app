# Host Phone Number Visibility Implementation

## Overview
This implementation allows match participants to view the host's phone number on the Match Details screen, while maintaining privacy through Row Level Security (RLS) in Supabase.

## Changes Made

### 1. Database - RLS Policy (`supabase/migrations/007_allow_participants_view_host_phone.sql`)

**Purpose**: Allow match participants to SELECT phone numbers from the profiles table ONLY if they are in the same match.

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy allowing match participants to view host phone
CREATE POLICY "Match participants can view host phone" 
ON profiles 
FOR SELECT 
USING (
  -- Users can view their own profile OR
  auth.uid() = id 
  OR 
  -- Users can view profiles of people in their matches
  EXISTS (
    SELECT 1 FROM match_participants mp1
    WHERE mp1.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM match_participants mp2
      WHERE mp2.match_id = mp1.match_id
      AND mp2.user_id = profiles.id
    )
  )
);
```

**How it works**:
1. The policy checks if the requesting user (`auth.uid()`) is in `match_participants`
2. If yes, it checks if the profile being requested is also in the same match
3. If both conditions are true, the phone number is accessible

**To Apply**:
```bash
# If using Supabase CLI
supabase db push

# Or run manually in Supabase SQL Editor
```

---

### 2. TypeScript Types (`types/index.ts`)

Added `phoneNumber` field to the `Player` interface:

```typescript
export interface Player {
  id: string;
  username: string;
  rank: Rank;
  avatar?: string;
  city: MoroccoCity;
  wins: number;
  losses: number;
  reputation: number;
  level: number;
  preferredSide?: CourtPosition;
  phoneNumber?: string;  // ✅ NEW
}
```

---

### 3. Mock Data (`lib/mockData.ts`)

Added phone numbers to the first 3 default mock users for testing:

```typescript
const DEFAULT_MOCK_USERS: MockUser[] = [
  { 
    id: 'u-01', 
    email: 'shadow@test.com', 
    username: 'ShadowStrike', 
    phoneNumber: '+212 6 12 34 56 78',  // ✅ NEW
    // ... other fields
  },
  // ...
];
```

---

### 4. Match Details UI (`app/match/[id].tsx`)

#### Import Phone Icon
```typescript
import { Phone } from 'lucide-react-native';
```

#### Convert Function Updated
```typescript
const convertMockUserToPlayer = (user: MockUser): Player => ({
  id: user.id,
  username: user.username,
  rank: user.rank,
  avatar: user.profilePicture,
  city: user.city,
  wins: user.wins,
  losses: user.losses,
  reputation: user.reputation,
  level: user.level,
  phoneNumber: user.phoneNumber,  // ✅ NEW
});
```

#### UI Display (Only visible to joined participants)
```typescript
{hasJoined && match.host.phoneNumber && (
  <View style={styles.hostPhoneContainer}>
    <Phone color={Colors.colors.primary} size={14} strokeWidth={2.5} />
    <Text style={styles.hostPhoneText}>{match.host.phoneNumber}</Text>
  </View>
)}
```

#### Styles Added
```typescript
hostPhoneContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginTop: 4,
  marginBottom: 4,
  backgroundColor: Colors.colors.surfaceLight,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 8,
  alignSelf: 'flex-start',
},
hostPhoneText: {
  fontSize: 13,
  fontWeight: '600' as const,
  color: Colors.colors.primary,
},
```

---

## Security Features

✅ **Privacy**: Phone numbers are ONLY visible to:
- The profile owner themselves
- Users who are participants in the same match

❌ **Blocked**: Phone numbers are NOT visible to:
- Users who haven't joined the match
- Users in different matches
- Anonymous/unauthenticated users

---

## Testing

### Mock Data Testing (Current)
1. Login as user 'u-02' (PhoenixAce)
2. Join the match hosted by 'u-01' (ShadowStrike)
3. View match details - you should see: `+212 6 12 34 56 78`

### Supabase Testing (When integrated)
1. Ensure the migration is applied
2. Test with real users joining matches
3. Verify phone number appears only after joining

---

## Database Schema Requirements

**For Supabase Integration**, ensure you have:

```sql
-- profiles or players table with phone_number column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- match_participants table
CREATE TABLE IF NOT EXISTS match_participants (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (match_id, user_id)
);
```

---

## Notes

- The implementation works with both mock data and Supabase
- Phone number display is conditional (`hasJoined && match.host.phoneNumber`)
- Uses mobile-friendly Moroccan format: `+212 6 XX XX XX XX`
- Styled with primary color to stand out
- Positioned between rank and stats for easy visibility

---

## Future Enhancements

Consider adding:
- Click-to-call functionality
- WhatsApp integration button
- Phone number validation on signup
- International number formatting
