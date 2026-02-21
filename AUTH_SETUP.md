# 🔐 Authentication Setup Guide

## Current Status

✅ **Authentication is now working!**
- Domain restrictions removed - all Google accounts can sign in
- Realtime Database is optional (won't block login if not configured)
- Chat feature disabled (no API key needed)

---

## How Authentication Works

### Sign In Process

1. User clicks "Sign in with Google"
2. Google OAuth popup appears
3. User selects their Google account
4. Firebase authenticates the user
5. User is signed in - no domain restrictions!

### What's Enabled

✅ Google Sign-In (any domain)
✅ User profile display
✅ Progress tracking (local)
✅ Exercise completion
✅ Lesson tracking

### What's Optional

⚠️ Realtime Database features (presence, online users)
- If database is configured: Shows online users, presence indicators
- If not configured: App works fine, just no presence features

---

## Firebase Configuration

### Current Setup

The app is configured with:
- **Project:** flowchart-to-code-learning
- **Auth Domain:** flowchart-to-code-learning.firebaseapp.com
- **Authentication:** Google Sign-In enabled

### Required Firebase Settings

For the app to work, you need:

1. **Firebase Authentication enabled**
   - Go to: https://console.firebase.google.com/project/flowchart-to-code-learning/authentication
   - Enable "Google" sign-in provider
   - Add authorized domains:
     - `navgurukul.github.io`
     - `localhost` (for development)

2. **Firestore Database (for progress tracking)**
   - Go to: https://console.firebase.google.com/project/flowchart-to-code-learning/firestore
   - Create database in production mode
   - Set security rules (see below)

3. **Realtime Database (optional - for presence)**
   - Go to: https://console.firebase.google.com/project/flowchart-to-code-learning/database
   - Create database
   - Set security rules (see below)

---

## Security Rules

### Firestore Rules (Required)

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own progress
    match /userProgress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow all authenticated users to read exercises and lessons
    match /exercises/{exerciseId} {
      allow read: if request.auth != null;
    }
    
    match /lessons/{lessonId} {
      allow read: if request.auth != null;
    }
  }
}
```

### Realtime Database Rules (Optional)

```json
{
  "rules": {
    "status": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    },
    "onlineUsers": {
      ".read": true,
      "$uid": {
        ".write": "$uid === auth.uid"
      }
    },
    "userProfile": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

---

## Testing Authentication

### Local Testing

1. Run the app locally:
```bash
npm run dev
```

2. Open: http://localhost:5173

3. Click "Sign in with Google"

4. Sign in with any Google account

5. You should see:
   - Your profile picture/name in header
   - "Sign Out" button
   - Access to all exercises and lessons

### Production Testing

1. Visit: https://navgurukul.github.io/Flowchart-to-Code-learning/

2. Click "Sign in with Google"

3. Sign in with any Google account

4. Should work the same as local

---

## Troubleshooting

### "Sign in with Google" button does nothing

**Possible causes:**
1. Firebase Authentication not enabled
2. Authorized domains not configured
3. Browser blocking popups

**Fix:**
1. Check Firebase Console → Authentication → Sign-in method → Google (should be enabled)
2. Check Firebase Console → Authentication → Settings → Authorized domains (add your domain)
3. Allow popups for the site

### "Error during sign-in" message

**Check browser console (F12) for errors:**

**Error: "auth/unauthorized-domain"**
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add: `navgurukul.github.io` and `localhost`

**Error: "auth/popup-blocked"**
- Allow popups in browser settings
- Try again

**Error: "auth/network-request-failed"**
- Check internet connection
- Check if Firebase is down: https://status.firebase.google.com/

### User signs in but immediately signs out

**This was the old domain restriction issue - now fixed!**

If it still happens:
1. Check browser console for errors
2. Make sure you're using the latest code (after the fix)
3. Clear browser cache and try again

### Presence features not working

**This is expected if Realtime Database isn't configured.**

The app will work fine without it. To enable presence:
1. Create Realtime Database in Firebase Console
2. Set security rules (see above)
3. Redeploy the app

---

## Development Notes

### Removed Features

- ❌ Domain restriction (@navgurukul.org only) - removed
- ❌ Backend authentication endpoint - removed
- ❌ Chat feature (Gemini API) - disabled

### Current Authentication Flow

```
User clicks "Sign in"
    ↓
Google OAuth popup
    ↓
User selects account
    ↓
Firebase authenticates
    ↓
User object created
    ↓
✅ User is signed in!
```

### No Backend Required

The app now works entirely client-side:
- Firebase handles authentication
- Firestore stores user progress
- No backend API needed

---

## Firebase Console Links

Quick access to Firebase settings:

- **Project Overview:** https://console.firebase.google.com/project/flowchart-to-code-learning
- **Authentication:** https://console.firebase.google.com/project/flowchart-to-code-learning/authentication
- **Firestore:** https://console.firebase.google.com/project/flowchart-to-code-learning/firestore
- **Realtime Database:** https://console.firebase.google.com/project/flowchart-to-code-learning/database
- **Settings:** https://console.firebase.google.com/project/flowchart-to-code-learning/settings/general

---

## Summary

✅ Authentication is working
✅ No domain restrictions
✅ No backend required
✅ No API keys needed
✅ Works with any Google account

Just make sure Firebase Authentication is enabled with Google sign-in provider, and you're good to go!

