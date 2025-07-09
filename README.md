# Flowchart-to-Code-learning

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/surajsahani/Flowchart-to-Code-learning)

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

## Flowchart Image Import (AI/ML Feature)

This feature allows users to upload an image of a flowchart. The backend then uses the Google Cloud Vision API to analyze the image, detect flowchart elements (text, shapes - basic implementation), and convert them into the application's JSON schema. The frontend renders this generated flowchart and runs validation rules.

### Backend Setup (Google Cloud Vision API)

The image analysis is performed by the `/api/analyze_flowchart_image` endpoint in the Python FastAPI backend (`backend/main.py`, with logic in `backend/flowchart_analyzer.py`).

1.  **Authentication**:
    *   The backend requires Google Cloud Application Default Credentials (ADC) to be set up in the environment where it runs. This typically involves:
        *   Installing the Google Cloud CLI (`gcloud`).
        *   Running `gcloud auth application-default login`.
    *   Alternatively, you can set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of a service account key JSON file.
        ```bash
        export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-file.json"
        ```
    *   Ensure the service account or your ADC has the "Cloud Vision API User" role (or equivalent permissions) enabled for your Google Cloud project.

2.  **Dependencies**:
    *   The necessary Python library `google-cloud-vision` is included in `backend/requirements.txt`. Ensure dependencies are installed by running `pip install -r requirements.txt` within the `backend` directory.

3.  **Key Parameters/Logic**:
    *   **Text Detection Confidence**: In `backend/flowchart_analyzer.py`, text blocks detected by the Vision API are only processed if their `confidence` score is `0.6` or higher.
    *   **Node Type Heuristics**: The current implementation uses basic text-based heuristics to assign types to nodes (e.g., "start", "end", "decision"). Shape detection is rudimentary and primarily based on text block analysis.
    *   **Edge Detection**: Currently, edge detection is **not implemented** in the backend. The returned `chartJson` will have an empty `edges` array.

### Local Development and Testing

1.  **Backend**:
    *   Navigate to the `backend` directory.
    *   Set up your Google Cloud credentials as described above.
    *   Ensure all dependencies are installed: `pip install -r requirements.txt`.
    *   Run the FastAPI server (example from `backend/main.py` comments):
        ```bash
        uvicorn main:app --reload --port 8000
        ```
    *   You can test the `/api/analyze_flowchart_image` endpoint using a tool like Postman, Insomnia, or `curl` by sending a POST request with a multipart/form-data image file.
        ```bash
        curl -X POST -F "file=@/path/to/your/flowchart_image.png" http://localhost:8000/api/analyze_flowchart_image -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
        ```
        (Note: `YOUR_FIREBASE_ID_TOKEN` would be required if testing against a deployed/secured instance; local testing might not enforce this if `get_current_user_data` is temporarily bypassed or mocked for ease of testing the Vision API part).

2.  **Frontend**:
    *   Ensure the frontend development server is running (e.g., `npm start` or `vite dev` from the root directory).
    *   Open the application in your browser.
    *   Navigate to the Flowchart Builder page.
    *   Use the "Import" button to upload a flowchart image.
    *   Observe the rendered flowchart (which will be based on text blocks and have no edges initially) and the validation report panel.
    *   The validation report will likely show many errors due to missing start/end nodes (if heuristics fail) and missing connections.

3.  **Backend Unit Tests**:
    *   Navigate to the `backend` directory.
    *   Run `python -m unittest test_flowchart_analyzer.py`. These tests mock the Vision API responses and check the data transformation logic.

4.  **Frontend E2E Tests (Cypress)**:
    *   Ensure Cypress is set up.
    *   Open Cypress: `npx cypress open` (from the root directory).
    *   Run the `flowchart-import.cy.ts` test suite. These tests mock the backend API call to `/api/analyze_flowchart_image` to provide consistent `chartJson` for testing UI rendering and validation display.