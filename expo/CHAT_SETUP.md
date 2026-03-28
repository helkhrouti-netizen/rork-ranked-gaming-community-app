# Chat System Setup Guide

This guide will help you set up the complete chat system for your padel match app.

## 📋 Overview

The chat system includes:
- **Group chats** for each match (all participants)
- **Direct messages** between any two users
- **Real-time messaging** using Supabase Realtime
- **Offline support** with automatic retry
- **Row-level security** (RLS) for data protection

## 🔧 Step 1: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (~2 minutes)
3. Note down your project credentials:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public Key (from Settings > API)

## 📝 Step 2: Update Environment Variables

Add these to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🗄️ Step 3: Run Database Migrations

### Option A: Using Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/001_chat_system.sql`
5. Click **Run** to execute
6. Repeat steps 3-5 for `supabase/migrations/002_rls_policies.sql`

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## ✅ Step 4: Verify Setup

After running migrations, verify these tables exist:
- ✅ `matches`
- ✅ `match_participants`
- ✅ `chats`
- ✅ `chat_members`
- ✅ `chat_messages`

Check RLS is enabled on all tables:
1. Go to **Authentication > Policies**
2. Verify each table has policies defined

## 🔐 Step 5: Configure Authentication

The chat system requires Supabase Auth to be set up:

```typescript
// This is already configured in lib/supabase.ts
// Users must be authenticated to send/receive messages
```

## 🎯 How It Works

### Match Creation Flow

When a match is created:
1. ✅ Creates a `chats` row with `match_id` and `is_dm=false`
2. ✅ Adds the host to `chat_members`
3. ✅ Stores `chatRoomId` in the match data

### Match Join Flow

When a player joins:
1. ✅ Adds player to `match_participants`
2. ✅ Adds player to `chat_members` for the match's group chat
3. ✅ Player can now send/receive messages

### Match Leave Flow

When a player leaves:
1. ✅ Removes player from `match_participants`
2. ✅ Removes player from `chat_members`
3. ✅ Player can no longer access the chat

### Direct Messages

When "Message Host" is clicked:
1. ✅ Calls `get_or_create_dm_chat(user1_id, user2_id)` PostgreSQL function
2. ✅ Returns existing DM or creates new one
3. ✅ Adds both users as `chat_members` if new
4. ✅ Opens chat screen

## 📱 Usage in App

### Open Group Chat
```typescript
// From match details screen
router.push(`/chat/${match.chatRoomId}`);
```

### Open DM with Host
```typescript
const dmChat = await chatService.createOrGetDM({
  userId1: currentUser.id,
  userId2: hostUser.id,
});
router.push(`/chat/${dmChat.id}`);
```

### Send a Message
```typescript
const { sendMessage } = useChatRoom({ chatId });
await sendMessage('Hello everyone!');
```

## 🔥 Realtime Features

Messages appear instantly on all devices:
- Uses Supabase Realtime subscriptions
- Subscribes to `postgres_changes` on `chat_messages`
- Filters by `chat_id` for efficiency
- Auto-scrolls to new messages

## 🛡️ Security Features

### Row-Level Security (RLS)

- ✅ Users can only view chats they're members of
- ✅ Users can only send messages to chats they belong to
- ✅ Users can only read messages from their chats
- ✅ Non-members are blocked by RLS (queries return empty)

### Test RLS

To verify RLS works:
1. Create a match as User A
2. Try to access chat as User B (should fail)
3. Join match as User B
4. Access chat as User B (should succeed)

## 🚨 Troubleshooting

### "Missing Supabase environment variables"
→ Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env`

### "You don't have permission to access this resource"
→ RLS is working correctly! User is not a member of the chat.

### Messages not appearing in realtime
→ Check Realtime is enabled in Supabase dashboard under **Database > Replication**

### "relation 'chats' does not exist"
→ Run the migration SQL files in the SQL Editor

## 🧪 Testing Checklist

- [ ] Create a match → Group chat is created
- [ ] Join match → User added to chat_members
- [ ] Send message → Appears immediately for all members
- [ ] Leave match → User removed from chat
- [ ] Try to access after leaving → Blocked by RLS
- [ ] Click "Message Host" → DM opens
- [ ] Send DM → Only host and sender see it
- [ ] Offline → Message queued and retried
- [ ] Network back → Pending messages sent

## 📚 API Reference

### chatService

```typescript
// Create group chat for match
await chatService.createGroupChat({
  matchId: 'uuid',
  hostUserId: 'uuid'
});

// Create or get DM
await chatService.createOrGetDM({
  userId1: 'uuid',
  userId2: 'uuid'
});

// Add member to chat
await chatService.addChatMember(chatId, userId);

// Remove member
await chatService.removeChatMember(chatId, userId);

// Send message
await chatService.sendMessage({
  chatId: 'uuid',
  body: 'Hello!',
  isSystem: false
});

// Get messages
const messages = await chatService.getChatMessages({
  chatId: 'uuid',
  limit: 100
});
```

### useChatRoom Hook

```typescript
const {
  messages,          // Array of messages with sender info
  isLoading,         // Initial load state
  error,             // Error string if any
  isSending,         // Sending state
  pendingMessages,   // Messages waiting to be sent
  sendMessage,       // Function to send message
  retryPendingMessages, // Manually retry failed messages
  refetch            // Reload messages
} = useChatRoom({ chatId, enabled: true });
```

## 🎉 You're Done!

Your chat system is now fully functional with:
- ✅ Group chats per match
- ✅ Direct messages
- ✅ Realtime delivery
- ✅ Offline support
- ✅ Secure RLS policies

Need help? Check the code in:
- `services/chat.ts` - Chat service functions
- `hooks/useChatRoom.ts` - Chat hook with realtime
- `app/chat/[id].tsx` - Chat UI component
