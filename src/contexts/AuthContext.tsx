// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Your Firebase auth instance

// Define the shape of the user object you want to store (can be extended)
interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
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
        const response = await fetch('/api/auth/google', {
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
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      // Handle errors here, perhaps set an error state
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      // setBackendUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // When auth state changes (e.g. page reload),
        // we have the Firebase user. If we had a separate backend session or user profile,
        // we might want to re-fetch/validate it here.
        // For this example, direct mapping is fine.
        setCurrentUser(mapFirebaseUserToAppUser(firebaseUser));
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

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
