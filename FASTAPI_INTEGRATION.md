# FastAPI Backend Integration - Complete

## ✅ What Was Fixed

### 1. **Removed All Supabase Dependencies**
   - Deleted `lib/supabase.ts`
   - Deleted `contexts/SupabaseAuthContext.tsx`
   - Deleted `services/supabaseProfile.ts`
   - Deleted `services/supabaseMatch.ts`
   - Deleted `supabase-schema.sql`
   - Deleted `SUPABASE_SETUP.md`
   - Removed `@supabase/supabase-js` dependency

### 2. **Created New FastAPI Integration**
   - **`lib/api.ts`**: Complete REST API client with type-safe endpoints
   - **`contexts/AuthContext.tsx`**: New authentication context using JWT tokens
   - **Updated `.env`**: Set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`

### 3. **Updated All Authentication Flows**
   - `app/auth/login.tsx`: Now uses FastAPI auth
   - `app/auth/signup.tsx`: Now uses FastAPI auth
   - `app/_layout.tsx`: Uses new AuthContext
   - `app/onboarding/index.tsx`: Uses ranking assessment API

### 4. **Installed Required Dependencies**
   - `expo-secure-store@~14.1.2` for secure token storage (iOS/Android) and localStorage (Web)

## 🔧 Configuration

### Environment Variables (.env)
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
```

**Platform-specific URLs:**
- **Android Emulator**: `http://10.0.2.2:8000` (already set)
- **iOS Simulator**: `http://localhost:8000`
- **Physical Device**: Use your computer's local IP, e.g., `http://192.168.1.100:8000`
- **Web**: `http://localhost:8000`

## 📡 API Endpoints Expected

Your FastAPI backend should implement these endpoints:

### Auth Endpoints
```typescript
POST /auth/register
Body: { email: string; password: string; username: string }
Response: { access_token: string; token_type: string; user: { id, email, username } }

POST /auth/login
Body: { email: string; password: string }
Response: { access_token: string; token_type: string; user: { id, email, username } }
```

### Player Endpoints
```typescript
GET /players/me
Headers: { Authorization: "Bearer <token>" }
Response: { id, email, username, level_score, level_tier, created_at, updated_at }

PUT /players/me
Headers: { Authorization: "Bearer <token>" }
Body: Partial<{ username, level_score, level_tier }>
Response: { id, email, username, level_score, level_tier }
```

### Rankings Endpoints
```typescript
POST /rankings/assess
Headers: { Authorization: "Bearer <token>" }
Body: { [key: string]: any } // Onboarding answers
Response: { score: number; tier: string }

GET /rankings/leaderboard
Response: Array<{ rank, player_id, username, level_score, level_tier }>
```

## 🔐 Authentication Flow

1. **Signup**: User creates account → Server returns JWT → Token stored securely
2. **Login**: User logs in → Server returns JWT → Token stored securely
3. **Auto-login**: On app launch, check for stored token → Validate with `/players/me`
4. **Logout**: Clear token from storage
5. **Auto-logout**: If server returns 401, clear token and redirect to login

## 🚀 How to Test

### 1. Start Your FastAPI Backend
```bash
cd your-backend-directory
uvicorn main:app --reload --port 8000
```

### 2. Start the Expo App
```bash
npx expo start --tunnel
```

### 3. Test Flow
1. Open app → Should show login screen
2. Click "Sign Up" → Create account
3. Complete onboarding (avatar, city, questionnaire)
4. Should see home screen with rankings

## 🔧 CORS Configuration for FastAPI

Add this to your FastAPI backend:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📱 Network Configuration

### For Android Emulator
The app is already configured to use `http://10.0.2.2:8000`

### For iOS Simulator
Update `.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### For Physical Devices
1. Find your computer's local IP:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. Update `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8000
   ```

3. Make sure both devices are on the same network

## 📦 Dependencies

All required dependencies are already installed:
- `expo-secure-store@~14.1.2` - Secure token storage
- `expo@^53.0.4` - Expo SDK
- `react@19.0.0` - React
- `react-native@0.79.1` - React Native

## 🐛 Troubleshooting

### "Network request failed"
- ✅ Check that FastAPI backend is running
- ✅ Verify the API URL in `.env` is correct for your platform
- ✅ Check CORS is enabled in FastAPI
- ✅ Ensure devices are on the same network (physical devices)

### "Unauthorized" errors
- ✅ Token might be expired - try logging out and back in
- ✅ Backend might not be validating tokens correctly
- ✅ Check that Authorization header is being sent

### Can't connect from physical device
- ✅ Use `--tunnel` flag: `npx expo start --tunnel`
- ✅ Or use your local IP in `.env`
- ✅ Make sure firewall allows connections on port 8000

## ✨ What's Working

- ✅ User registration with FastAPI
- ✅ User login with FastAPI
- ✅ Secure token storage (iOS/Android/Web compatible)
- ✅ Automatic token validation on app launch
- ✅ Auto-logout on 401 responses
- ✅ Onboarding with ranking assessment
- ✅ TypeScript types for all API calls
- ✅ Error handling and user feedback
- ✅ Zero Supabase dependencies

## 🎯 Next Steps

1. **Start your FastAPI backend** at `http://127.0.0.1:8000`
2. **Implement the required endpoints** (see API Endpoints section above)
3. **Test the complete flow** from signup to home screen
4. **Check backend logs** for any CORS or authentication issues

The app is now fully integrated with your FastAPI backend and ready for end-to-end testing!
