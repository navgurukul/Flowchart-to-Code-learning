// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, app } from '../firebaseConfig'; // Your Firebase auth instance and app instance
import { getDatabase, ref, set, onDisconnect, serverTimestamp, onValue, Unsubscribe } from 'firebase/database'; // Firebase Realtime Database

// Define the shape of the user object you want to store (can be extended)
interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null; // Add this line
  // Add other relevant backend user details if needed
  // e.g., points?: number; tasksCompleted?: string[];
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // backendUser?: BackendUserDetails | null; // For user details from your own backend
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  // const [backendUser, setBackendUser] = useState<BackendUserDetails | null>(null);

  const mapFirebaseUserToAppUser = (firebaseUser: FirebaseUser): AppUser => {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL, // Add this line
    };
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        // TODO: Adjust the fetch URL if your backend is on a different port/domain
        // e.g., http://localhost:8000/api/auth/google
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''; // Fallback to empty for same-origin or proxy
        const endpoint = `${apiBaseUrl}/api/auth/google`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: idToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Backend auth error:', errorData);
          // Potentially sign out the user from Firebase if backend validation fails critically
          await firebaseSignOut(auth);
          setCurrentUser(null);
          // setBackendUser(null);
          throw new Error(errorData.detail || 'Failed to authenticate with backend.');
        }

        // const backendData = await response.json(); // This is your FirebaseUser model from backend
        // console.log("Backend response:", backendData);
        // For now, AppUser is derived from FirebaseUser directly after backend confirmation
        setCurrentUser(mapFirebaseUserToAppUser(firebaseUser));
        // Construct welcome message
        const welcomeMessage = firebaseUser.displayName
          ? `Welcome, ${firebaseUser.displayName.split(' ')[0]}!` // Use first name if display name exists
          : 'Signed in successfully!';
        toast.success(welcomeMessage);
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      // Handle errors here, perhaps set an error state
    }
  };

  const signOut = async () => {
    try {
      if (currentUser) {
        const db = getDatabase(app);
        const userStatusDatabaseRef = ref(db, '/status/' + currentUser.uid);
        await set(userStatusDatabaseRef, { online: false, last_changed: serverTimestamp() });
      }
      await firebaseSignOut(auth);
      setCurrentUser(null);
      // setBackendUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out.");
    }
  };

  useEffect(() => {
    let presenceOnValueUnsubscribe: Unsubscribe | undefined;
    let userStatusDatabaseRefClean: any = null; // To store ref for onDisconnect cleanup

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setCurrentUser(mapFirebaseUserToAppUser(firebaseUser));

        const db = getDatabase(app);
        const userStatusDatabaseRef = ref(db, '/status/' + firebaseUser.uid);
        userStatusDatabaseRefClean = userStatusDatabaseRef; // Save for potential cleanup
        const presenceRef = ref(db, '.info/connected');

        // Clean up previous listener if any
        if (presenceOnValueUnsubscribe) {
          presenceOnValueUnsubscribe();
        }

        presenceOnValueUnsubscribe = onValue(presenceRef, (snapshot) => {
          if (snapshot.val() === false) {
            // If disconnected, Firebase Realtime Database handles setting offline via onDisconnect
            // No immediate action needed here unless explicitly required by logic
            return;
          }
          // User is connected (or reconnected)
          onDisconnect(userStatusDatabaseRef).set({ online: false, last_changed: serverTimestamp() })
            .then(() => {
              set(userStatusDatabaseRef, { online: true, last_changed: serverTimestamp() });
            })
            .catch((error) => {
              console.error("Error setting up onDisconnect or user status:", error);
            });
        });

      } else {
        // User is logged out
        if (presenceOnValueUnsubscribe) {
          presenceOnValueUnsubscribe(); // Detach the .info/connected listener
          presenceOnValueUnsubscribe = undefined;
        }
        // If there was an active onDisconnect setup for a user,
        // and they logged out manually, it should ideally be cancelled.
        // However, onDisconnect is designed to fire when the client *actually* disconnects.
        // If the user logged out gracefully, we already set their status to offline in `signOut`.
        // If `userStatusDatabaseRefClean` is available, we can try to cancel:
        if (userStatusDatabaseRefClean) {
            // onDisconnect(userStatusDatabaseRefClean).cancel(); // Not strictly necessary if signOut handles it
            // We can also just remove the status node or set to offline if not handled by signOut,
            // but signOut *is* handling it.
        }
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      authUnsubscribe(); // Cleanup Firebase Auth subscription
      if (presenceOnValueUnsubscribe) {
        presenceOnValueUnsubscribe(); // Cleanup presence listener
      }
      // If there's an onDisconnect set for a user and the component unmounts (e.g. app closing, not just logout)
      // it should ideally be cancelled. However, onDisconnect is tied to the connection itself.
      // If userStatusDatabaseRefClean is available:
      // if (userStatusDatabaseRefClean) {
      //   onDisconnect(userStatusDatabaseRefClean).cancel();
      // }
      // Forcing offline on component unmount might be too aggressive if it's not a true disconnect/logout
    };
  }, []); // currentUser removed from dependency array to avoid re-running on its change

  return (
    <AuthContext.Provider value={{ currentUser, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
