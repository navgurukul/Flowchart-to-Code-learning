// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, app } from '../firebaseConfig'; // Your Firebase auth instance and app instance
import { getDatabase, ref, set, onDisconnect, serverTimestamp, onValue, Unsubscribe } from 'firebase/database'; // Firebase Realtime Database
import DomainBlockModal from '../components/DomainBlockModal'; // Import the modal

const ALLOWED_DOMAIN = 'navgurukul.org';

// Define the shape of the user object you want to store (can be extended)
interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  // User progress and details
  points?: number;
  completedExercises?: number[];
  currentExercise?: number | null;
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  showDomainBlockModal: boolean; // Added state for modal
  closeDomainBlockModal: () => void; // Added function to close modal
  // backendUser?: BackendUserDetails | null; // For user details from your own backend
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDomainBlockModal, setShowDomainBlockModal] = useState(false); // State for modal visibility
  // const [backendUser, setBackendUser] = useState<BackendUserDetails | null>(null);

  const mapFirebaseUserToAppUser = (firebaseUser: FirebaseUser): AppUser => {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    };
  };

  const closeDomainBlockModal = () => {
    setShowDomainBlockModal(false);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (firebaseUser && firebaseUser.email) {
        const emailDomain = firebaseUser.email.split('@')[1];
        if (emailDomain !== ALLOWED_DOMAIN) {
          toast.error(`Access restricted to ${ALLOWED_DOMAIN} domain.`);
          setShowDomainBlockModal(true);
          await firebaseSignOut(auth); // Sign out immediately
          setCurrentUser(null);
          return; // Stop further processing
        }

        // Domain is allowed, proceed with backend authentication
        const idToken = await firebaseUser.getIdToken();
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const endpoint = `${apiBaseUrl}/auth/google`; // Updated to /auth/google as per plan

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
          toast.error(errorData.detail || 'Failed to authenticate with backend.');
          await firebaseSignOut(auth);
          setCurrentUser(null);
          // Potentially show a generic error modal or message
          if (errorData.detail && errorData.detail.includes("domain")) {
            setShowDomainBlockModal(true); // Show domain block modal if backend indicates domain issue
          }
          return;
        }

        // const backendData = await response.json(); // This is your FirebaseUser model from backend
        // console.log("Backend response:", backendData);

        setCurrentUser(mapFirebaseUserToAppUser(firebaseUser));

        const welcomeMessage = firebaseUser.displayName
          ? `Welcome, ${firebaseUser.displayName.split(' ')[0]}!`
          : 'Signed in successfully!';
        toast.success(welcomeMessage);
      } else if (firebaseUser && !firebaseUser.email) {
        // Handle case where email is not available from provider, though unlikely for Google
        toast.error('Could not retrieve email from provider. Please try again.');
        await firebaseSignOut(auth);
        setCurrentUser(null);
        return;
      }
    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled.');
      } else if (error.message && error.message.includes("domain")) { // Check if error message from backend indicates domain issue
        setShowDomainBlockModal(true);
      } else {
        toast.error('An error occurred during sign-in.');
      }
      // Ensure user is signed out from Firebase if any error occurs during the process
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
      setCurrentUser(null);
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
        // Initial check: if a user is already authenticated in Firebase, verify their domain.
        // This handles cases like page refresh.
        if (firebaseUser.email && firebaseUser.email.split('@')[1] !== ALLOWED_DOMAIN) {
          toast.error(`Access restricted to ${ALLOWED_DOMAIN} domain.`);
          setShowDomainBlockModal(true);
          await firebaseSignOut(auth); // Sign out from Firebase
          setCurrentUser(null); // Clear local user state
          setLoading(false);
          return; // Stop further processing for this user
        }
        // If domain is okay or email is not yet available (should be rare for Google Auth)
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
            return;
          }
          onDisconnect(userStatusDatabaseRef).set({ online: false, last_changed: serverTimestamp() })
            .then(() => {
              set(userStatusDatabaseRef, { online: true, last_changed: serverTimestamp() });
            })
            .catch((error) => {
              console.error("Error setting up onDisconnect or user status:", error);
            });
        });

      } else {
        if (presenceOnValueUnsubscribe) {
          presenceOnValueUnsubscribe();
          presenceOnValueUnsubscribe = undefined;
        }
        if (userStatusDatabaseRefClean) {
          // onDisconnect(userStatusDatabaseRefClean).cancel(); // Not strictly necessary
        }
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      authUnsubscribe();
      if (presenceOnValueUnsubscribe) {
        presenceOnValueUnsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, signInWithGoogle, signOut, showDomainBlockModal, closeDomainBlockModal }}>
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
