# Chat System Integration Guide

This guide explains how to integrate the new Supabase-based chat system with your existing mock data provider.

## 🔄 Integration Points

### 1. Match Creation (app/match/create.tsx)

**Current:** Creates match in mock data provider
**Add:** Create group chat and add host as member

```typescript
// After creating match in mockDataProvider
const newMatch = await mockDataProvider.createMatch(user.id, {...});

// ADD THIS:
try {
  const groupChat = await chatService.createGroupChat({
    matchId: newMatch.id,
    hostUserId: user.id,
  });
  
  // Store chatRoomId in match (you may need to update mockDataProvider)
  newMatch.chatRoomId = groupChat.id;
  
  console.log('✅ Group chat created:', groupChat.id);
} catch (error) {
  console.error('❌ Failed to create group chat:', error);
  // Match is created but chat failed - non-critical
}
```

### 2. Match Join (app/match/[id].tsx)

**Current:** Adds player to mock match players
**Add:** Add player to chat members

```typescript
// After joining match
await mockDataProvider.joinMatch(id, user.id);

// ADD THIS:
if (match.chatRoomId) {
  try {
    await chatService.addChatMember(match.chatRoomId, user.id);
    console.log('✅ Added to chat');
  } catch (error) {
    console.error('❌ Failed to add to chat:', error);
    // Player joined match but not chat - they can try again
  }
}
```

### 3. Match Leave (app/match/[id].tsx)

**Current:** Removes player from mock match players
**Add:** Remove player from chat members

```typescript
// After leaving match
await mockDataProvider.leaveMatch(id, user.id);

// ADD THIS:
if (match.chatRoomId) {
  try {
    await chatService.removeChatMember(match.chatRoomId, user.id);
    console.log('✅ Removed from chat');
  } catch (error) {
    console.error('❌ Failed to remove from chat:', error);
    // Non-critical - RLS will prevent access anyway
  }
}
```

## 🗄️ Database Schema Notes

### Syncing with Mock Data

The chat system uses Supabase tables. Your mock data provider uses AsyncStorage. They are **independent** systems:

- **Matches:** Still managed by mockDataProvider (AsyncStorage)
- **Chats:** Managed by Supabase (PostgreSQL)
- **Chat membership:** Managed by Supabase (PostgreSQL)

### Match ID Consistency

**Important:** Use the same UUID for matches in both systems:

```typescript
// When creating a match
const matchId = uuid.v4(); // Generate once

// Use in mockDataProvider
await mockDataProvider.createMatch(userId, { id: matchId, ... });

// Use in chatService
await chatService.createGroupChat({ matchId, hostUserId });
```

## 🔐 Authentication Flow

The chat system requires **Supabase Auth**. Currently you use a mock auth system.

### Option A: Keep Mock Auth (Easier)

Continue using your mock auth but sync user IDs with Supabase:

```typescript
// After mock signup/login
const mockUser = await mockDataProvider.signup(email, password, username);

// Create Supabase user with same ID (if needed)
// This requires Supabase service role key - not recommended for client
```

### Option B: Migrate to Supabase Auth (Recommended)

Replace your mock auth with Supabase Auth:

```typescript
// Signup
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { username } // Store username in metadata
  }
});

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

## 🎯 Quick Start Integration

### Step 1: Update .env

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Run Migrations

Run both SQL files in Supabase SQL Editor:
1. `supabase/migrations/001_chat_system.sql`
2. `supabase/migrations/002_rls_policies.sql`

### Step 3: Test Basic Flow

```typescript
// 1. Create match
const match = await mockDataProvider.createMatch(userId, {...});
const chat = await chatService.createGroupChat({ 
  matchId: match.id, 
  hostUserId: userId 
});

// 2. Another user joins
await mockDataProvider.joinMatch(match.id, otherUserId);
await chatService.addChatMember(chat.id, otherUserId);

// 3. Send message
await chatService.sendMessage({
  chatId: chat.id,
  body: 'Hello!'
});

// 4. Both users see message in real-time via useChatRoom hook
```

## ⚠️ Known Limitations

### Current Setup

- **Match data:** Still in AsyncStorage (mock)
- **Chat data:** In Supabase (real database)
- **Auth:** Still using mock auth

This means:
- ✅ Chats work across devices (Supabase)
- ❌ Matches don't sync across devices (AsyncStorage)
- ⚠️ Must use consistent user IDs

### Future Improvements

To make everything sync properly:

1. **Migrate matches to Supabase**
   - Replace mockDataProvider with Supabase queries
   - Store matches in `matches` table

2. **Use Supabase Auth**
   - Replace mock auth with `supabase.auth.*`
   - Automatic user ID consistency

3. **Add profiles table**
   - Store username, avatar, rank
   - Link to auth.users via foreign key

## 🐛 Debugging

### "User not found in chat_members"

User wasn't added when joining. Check:
```typescript
const isMember = await chatService.isChatMember(chatId, userId);
console.log('Is member?', isMember);
```

### "Cannot read property 'map' of undefined"

Match data structure issue. Check:
```typescript
console.log('Match:', JSON.stringify(match, null, 2));
console.log('Players:', match.players);
console.log('ChatRoomId:', match.chatRoomId);
```

### Messages not appearing

Check Supabase Realtime is enabled:
1. Go to Database > Replication
2. Enable Realtime for `chat_messages` table

## 📞 Support

If you run into issues:

1. Check browser console for errors
2. Check Supabase logs (Logs > Query Performance)
3. Verify RLS policies are correct
4. Test with multiple accounts

The chat system is **independent** of your mock data, so you can test it separately with direct Supabase queries.
