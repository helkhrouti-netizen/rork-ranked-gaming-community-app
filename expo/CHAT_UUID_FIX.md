# Chat UUID Fix

## Problem
The application was throwing the error: `invalid input syntax for type uuid: "chat-match-1"`

This occurred because:
1. The app was using a hardcoded string `"chat-match-1"` as a placeholder chat ID
2. When trying to navigate to or query the chat, it sent this invalid string instead of a proper UUID
3. The database expects UUIDs for the `chats.id` field

## Root Cause
- When a match was created, the app didn't properly fetch the actual chat UUID from the database
- The match details screen was using fallback/placeholder values instead of querying for the real chat ID
- There was no database trigger to automatically create a chat when a match was created

## Solution

### 1. Added Database Trigger (supabase/migrations/004_auto_create_match_chat.sql)
Created a trigger that automatically creates a chat room when a match is created:
- Automatically inserts a chat entry with a valid UUID
- Links the chat to the match via `match_id`
- Adds the host as the first chat member
- Sends a welcome system message

### 2. Updated Match Details Screen (app/match/[id].tsx)
- Changed from `actualChatId` to simply `chatId` state variable
- When loading a match, the app now:
  1. First tries to fetch the existing chat using `chatService.getChatByMatchId(matchId)`
  2. If no chat exists, creates one using `chatService.createGroupChat()`
  3. Stores the real UUID in the `chatId` state
- When joining/leaving a match, uses the stored `chatId` (not fallback values)
- When opening the chat, uses the stored `chatId` (not fallback values)

### 3. Updated Create Match Screen (app/match/create.tsx)
- After creating a match, checks if a chat already exists
- If not, creates one using the chat service
- Removed logic that tried to update mock data with chat IDs (since DB trigger handles it)

## How It Works Now

### Creating a Match
1. User creates a match
2. Database trigger automatically creates a chat with a UUID (e.g., `"a3b5c7d9-...e1f2"`)
3. App checks for the chat and confirms it exists
4. Navigates to match details

### Viewing Match Details
1. App loads match data
2. App queries database for chat using `match_id`
3. If found, stores the real UUID
4. If not found, creates a new chat and stores its UUID
5. Shows "Open Match Chat" button with the real UUID

### Opening the Chat
1. User clicks "Open Match Chat"
2. App navigates to `/chat/{REAL_UUID}` (not `"chat-match-1"`)
3. Chat screen receives valid UUID
4. Database queries work correctly

## Testing
To verify the fix works:
1. Create a new match
2. Check console logs for: `✅ Found chat for match: {UUID}`
3. Join the match
4. Click "Open Match Chat"
5. Chat should load without UUID errors
6. Send a message to confirm it works

## Key Changes
- **Before**: Used hardcoded `"chat-match-1"` string
- **After**: Uses real database UUIDs like `"a3b5c7d9-1234-5678-90ab-cdef12345678"`
- **Result**: No more "invalid input syntax for type uuid" errors
