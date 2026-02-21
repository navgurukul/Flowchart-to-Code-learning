# 🎓 Flowchart-to-Code Learning Platform

An interactive educational platform for learning programming through flowcharts. Students can visualize algorithms, build flowcharts, and understand code execution step-by-step.

## 🌐 Live Demo

**🚀 Try it now:** https://navgurukul.github.io/Flowchart-to-Code-learning/

## ✨ Features

- 📊 **Interactive Flowchart Builder** - Drag-and-drop interface to create flowcharts
- 🎮 **Gamified Exercise Map** - 50 exercises with snake-like progression paths
- 📚 **17 Comprehensive Lessons** - From basics to advanced topics
- 🤖 **AI-Powered Import** - Convert hand-drawn flowcharts using YOLO model
- 🎯 **Dry Run Mode** - Step-by-step execution visualization
- 👥 **Real-time Collaboration** - See other users working on exercises
- 🏆 **Progress Tracking** - Track completed exercises and lessons
- 🔐 **Domain-Restricted Access** - Secure access for @navgurukul.org users

## 🚀 Quick Start

### For Students

1. Visit: https://navgurukul.github.io/Flowchart-to-Code-learning/
2. Sign in with your @navgurukul.org Google account
3. Start with the "Learn" tab to understand flowchart basics
4. Move to "Practice" tab to solve exercises
5. Build flowcharts and see them execute in real-time!

### For Developers

```bash
# Clone the repository
git clone https://github.com/navgurukul/Flowchart-to-Code-learning.git
cd Flowchart-to-Code-learning

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get started quickly
- **[Deployment Guide](GITHUB_PAGES_DEPLOYMENT.md)** - Deploy to GitHub Pages
- **[Frontend Setup](FRONTEND_ONLY_SETUP.md)** - Frontend-only setup
- **[Complete Curriculum](COMPLETE_CURRICULUM.md)** - Full learning path

## 🔒 Security and Domain Restriction

This application is configured to restrict access to users with `@navgurukul.org` email addresses. This is enforced on both the client-side and server-side.

### Client-Side Enforcement

*   When a user attempts to sign in with Google, the application checks their email domain after successful authentication with Google.
*   If the email domain is not `@navgurukul.org`, the user is immediately signed out from Firebase, and a modal is displayed informing them of the domain restriction.
*   This logic resides in `src/contexts/AuthContext.tsx`.

### Server-Side Enforcement

*   The backend API (FastAPI application in `backend/main.py`) also enforces this domain restriction.
*   The `/auth/google` endpoint, used to finalize user authentication with the backend, verifies the Firebase ID token and checks the email domain. Non-`@navgurukul.org` users will receive a 403 Forbidden error.
*   Protected endpoints (e.g., `/api/chat`, `/users/{user_id}/details`) require a valid Firebase ID token from a `@navgurukul.org` user. A reusable dependency (`get_current_user_data`) handles this verification.
    *   Requests to these endpoints without a valid token or from a non-allowed domain will result in 401 Unauthorized or 403 Forbidden errors.
    *   The `/users/{user_id}/details` endpoint further ensures that the authenticated user can only access their own data.

### Firestore Security Rules

To ensure data in Firestore is also protected and accessible only by authenticated NavGurukul users, you **must** update your Firestore security rules in the Firebase console.

It is recommended to implement rules similar to the following:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Example: User progress data
    // Assumes user progress is stored under a collection 'userProgress'
    // where document IDs are user UIDs.
    match /userProgress/{userId} {
      // Allow read and write only if the requesting user is authenticated,
      // their email is verified, their email ends with '@navgurukul.org',
      // and they are accessing their own document.
      allow read, write: if request.auth != null &&
                            request.auth.token.email_verified == true &&
                            request.auth.token.email.endsWith('@navgurukul.org') &&
                            request.auth.uid == userId;
    }

    // Example: Other collections that need protection
    // match /someOtherCollection/{docId} {
    //   allow read, write: if request.auth != null &&
    //                         request.auth.token.email_verified == true &&
    //                         request.auth.token.email.endsWith('@navgurukul.org');
    //   // Adjust read/write permissions as needed for specific collections.
    //   // Some collections might only need read access for all NavGurukul users,
    //   // while others might be more restrictive.
    // }

    // Ensure to add rules for all collections you use.
    // By default, if no rule matches, access is denied.
  }
}
```

**Important:**
*   Test these rules thoroughly in the Firebase console's rules playground before applying them to your production environment.
*   Adapt the collection paths (e.g., `userProgress/{userId}`) to match your actual Firestore database structure.
*   The `request.auth.token.email_verified == true` check is a good practice to ensure the email address is legitimate.

### Adjusting the Allowed Domain

Currently, the allowed domain is hardcoded as `@navgurukul.org` in:
*   `src/contexts/AuthContext.tsx` (client-side)
*   `backend/main.py` (server-side)

If you need to change or add allowed domains, you would need to update the `ALLOWED_DOMAIN` constant in these files. For more complex scenarios (e.g., multiple allowed domains from a configuration), the implementation would need to be adjusted accordingly.
