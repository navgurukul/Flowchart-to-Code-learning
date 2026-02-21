import React, { useState, useEffect } from 'react';
import { StudentProgress } from '../types'; // Ensure this path is correct
import { User, Trophy, Target, Clock, HelpCircle, Signal, Eye, EyeOff } from 'lucide-react'; // Added Eye, EyeOff
import { useAuth } from '../contexts/AuthContext';
import { getDatabase, ref, onValue, onDisconnect, set, serverTimestamp, remove, get } from 'firebase/database'; // Added remove, get
import { app } from "../firebaseConfig";

interface HeaderProps {
  progress: StudentProgress;
  onReplayTour: () => void; // Added for replaying the interactive tour
}

// Define the structure for user presence data
interface UserPresence {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  currentFlowchartId: string | null;
  currentNodeId: string | null;
  lastSeen: object; // For Firebase ServerValue.TIMESTAMP
  status: 'online' | 'idle' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({ progress, onReplayTour }) => { // Added onReplayTour
  const { currentUser, signInWithGoogle, signOut: authSignOut, loading } = useAuth(); // Renamed signOut to authSignOut
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [appearOffline, setAppearOffline] = useState<boolean>(false);
  const db = getDatabase(app); // db instance

  // Effect to load 'appearOffline' preference
  useEffect(() => {
    if (currentUser) {
      const userSettingsRef = ref(db, `userProfile/${currentUser.uid}/settings/appearOffline`);
      get(userSettingsRef).then((snapshot) => {
        if (snapshot.exists()) {
          setAppearOffline(snapshot.val());
        } else {
          setAppearOffline(false); // Default to online
        }
      }).catch(error => console.error("Error fetching appearOffline setting:", error));
    }
  }, [currentUser, db]);

  // Effect to handle presence updates based on currentUser and appearOffline status
  useEffect(() => {
    const onlineUsersOverallRef = ref(db, "onlineUsers"); // Ref for counting all online users

    // Listener for online users count (reads from /onlineUsers directly)
    const unsubscribeCounter = onValue(onlineUsersOverallRef, (snapshot) => {
      const users = snapshot.val();
      setOnlineUsersCount(users ? Object.keys(users).length : 0);
    });

    let userPresenceRef: any = null; // To store ref for onDisconnect

    if (currentUser) {
      userPresenceRef = ref(db, `onlineUsers/${currentUser.uid}`); // Specific user's presence path

      if (!appearOffline) {
        // User wants to be online
        const presenceData: UserPresence = {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          currentFlowchartId: null, // Will be updated by App.tsx
          currentNodeId: null,    // Will be updated by FlowchartBuilder.tsx
          lastSeen: serverTimestamp(),
          status: 'online',
        };
        set(userPresenceRef, presenceData)
          .then(() => onDisconnect(userPresenceRef!).remove()) // Set onDisconnect after successful write
          .catch(error => console.error("Error setting presence online:", error));
      } else {
        // User wants to be offline, remove their presence data
        remove(userPresenceRef)
          .catch(error => console.error("Error setting presence offline:", error));
        // Crucially, also remove the onDisconnect handler if previously set for this session
        onDisconnect(userPresenceRef).cancel();
      }
    }

    return () => {
      unsubscribeCounter();
      // If user logs out while "appear offline" is false, their onDisconnect will fire.
      // If "appear offline" is true, their record should already be removed.
      // No specific cleanup needed here for userPresenceRef beyond what onDisconnect handles
      // or what happens when currentUser becomes null.
    };
  }, [currentUser, db, appearOffline]);


  const handleToggleAppearOffline = () => {
    if (!currentUser) return;
    const newAppearOfflineStatus = !appearOffline;
    setAppearOffline(newAppearOfflineStatus); // Update local state immediately for UI responsiveness

    const userSettingsRef = ref(db, `userProfile/${currentUser.uid}/settings/appearOffline`);
    set(userSettingsRef, newAppearOfflineStatus)
      .catch(error => {
        console.error("Error saving appearOffline setting:", error);
        // Optionally, revert local state if Firebase write fails
        setAppearOffline(!newAppearOfflineStatus);
      });
    // The useEffect for presence will handle updating /onlineUsers based on newAppearOfflineStatus
  };

  const handleSignOut = () => {
    // Ensure presence is removed if user was online before signing out
    if (currentUser && !appearOffline) {
        const userPresenceRef = ref(db, `onlineUsers/${currentUser.uid}`);
        remove(userPresenceRef).catch(err => console.error("Error removing presence on sign out:", err));
    }
    authSignOut(); // Call original signOut from useAuth
  };


  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3"> {/* Adjusted padding for smaller screens */}
      <div className="flex items-center justify-between">
        {/* Left Section: Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-2">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              ProblemSolver Lab
            </h1>
          </div>
          {/* NavGurukul Labs Logo */}
          <div className="hidden md:flex items-center pl-4 border-l border-gray-300">
            <svg width="220" height="36" viewBox="0 0 960 400" className="h-8" xmlns="http://www.w3.org/2000/svg">
              <text x="90" y="240" fontFamily="Arial, sans-serif" fontSize="120" fontWeight="bold" fill="#FF5722">ai.</text>
              <text x="200" y="240" fontFamily="Arial, sans-serif" fontSize="120" fontWeight="bold" fill="#000000">navgurukil</text>
              <rect x="770" y="180" width="180" height="80" rx="10" stroke="#000000" strokeWidth="4" fill="none"/>
              <text x="785" y="235" fontFamily="Arial, sans-serif" fontSize="48" fontWeight="bold" fill="#000000">LABS</text>
            </svg>
          </div>
        </div>

        {/* Right Section: Stats, Auth, and Guide Button */}
        <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
          {/* Stats & Online Users Count - Conditionally render based on user and screen size */}
          {currentUser && (
            <div className="hidden lg:flex items-center space-x-3 md:space-x-4"> {/* Hidden on smaller than lg */}
              <div className="flex items-center text-green-600" title="Online Users">
                <Signal size={16} className="mr-1" />
                <span className="text-xs sm:text-sm font-medium">
                  {onlineUsersCount} Online
                </span>
              </div>
              <div className="flex items-center" title="Total Score">
                <Trophy className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {progress.totalScore} pts
                </span>
              </div>

              <div className="flex items-center" title="Completed Exercises">
                <Target className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {progress.completedExercises.length} done
                </span>
              </div>

              <div className="flex items-center" title={`Last Active: ${new Date(progress.lastAccessedAt).toLocaleDateString()}`}>
                <Clock className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 hidden xl:inline"> {/* Show full text on xl */}
                  Active: {new Date(progress.lastAccessedAt).toLocaleDateString()}
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-700 xl:hidden"> {/* Show short on smaller */}
                  {new Date(progress.lastAccessedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Mobile Online Users Count (visible on smaller than lg) */}
          {currentUser && (
            <div className="flex items-center text-green-600 lg:hidden" title="Online Users">
              <Signal size={16} className="mr-1" />
              <span className="text-xs sm:text-sm font-medium">
                {onlineUsersCount}
              </span>
            </div>
          )}

          {/* Auth Section & Guide Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {loading ? (
              <p className="text-xs sm:text-sm text-gray-700">Loading...</p>
            ) : currentUser ? (
              <>
                <button
                  onClick={handleToggleAppearOffline}
                  className={`p-1.5 sm:p-2 rounded-full transition-colors duration-150 mr-1 sm:mr-2
                              ${appearOffline
                                ? 'text-gray-400 hover:bg-gray-200'
                                : 'text-green-600 hover:bg-green-100'}`}
                  title={appearOffline ? "Appear Online" : "Appear Offline"}
                >
                  {appearOffline ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <div className="flex items-center" title={currentUser.displayName || currentUser.email || currentUser.uid}>
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User profile'}
                      className="w-6 h-6 rounded-full mr-1 sm:mr-2 object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-600 mr-1 sm:mr-2" />
                  )}
                  <span className="text-xs sm:text-sm font-medium text-gray-700 hidden md:inline"> {/* Hide name on small screens */}
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut} // Use the new handler
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-2 sm:py-2 sm:px-3 rounded text-xs sm:text-sm transition-colors duration-150"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-2 sm:py-2 sm:px-3 rounded text-xs sm:text-sm transition-colors duration-150"
              >
                Sign in with Google
              </button>
            )}

            <button
              onClick={onReplayTour}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-150"
              title="Replay Interactive Tour"
              aria-label="Replay Interactive Tour"
            >
              <HelpCircle size={20} /> {/* Using HelpCircle icon for consistency, could be changed */}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};