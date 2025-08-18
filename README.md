# Flowchart-to-Code-learning

## Security and Domain Restriction

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

## Image Analysis Documentation

This repository includes comprehensive documentation for a 4-algorithm image analysis system designed for flowchart comparison. The system uses the following scoring formula:

**Final Score = (Structure × 30%) + (Color Histogram × 25%) + (Edges × 25%) + (Dominant Colors × 20%)**

### 📁 Documentation Files

- **[docs/](./docs/)** - Complete documentation directory
- **[docs/IMAGE_ANALYSIS_ALGORITHMS.md](./docs/IMAGE_ANALYSIS_ALGORITHMS.md)** - Detailed technical documentation
- **[docs/PRESENTATION_SUMMARY.md](./docs/PRESENTATION_SUMMARY.md)** - Presentation-ready summary
- **[docs/image_analyzer_implementation.py](./docs/image_analyzer_implementation.py)** - Working implementation example

### The 4 Algorithms

1. **Structure Analysis (30%)** - Spatial arrangement and geometric relationships
2. **Color Histogram (25%)** - Color distribution patterns and visual consistency  
3. **Edge Detection (25%)** - Boundary analysis and shape comparison
4. **Dominant Colors (20%)** - Color palette similarity and visual theme

This documentation provides everything needed for presentations, technical implementation, and understanding the algorithmic approach to flowchart image comparison.
