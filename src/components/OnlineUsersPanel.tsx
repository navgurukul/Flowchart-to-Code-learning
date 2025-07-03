import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../firebaseConfig'; // Assuming your Firebase app initialization is exported from here
import { User } from 'lucide-react'; // For default avatar

// This should match the structure in Header.tsx and our plan
interface UserPresence {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  currentFlowchartId: string | null;
  currentNodeId: string | null;
  lastSeen: number; // Timestamp will be a number once read
  status: 'online' | 'idle' | 'offline';
}

// Props for the component (if any needed in the future)
interface OnlineUsersPanelProps {
  currentUserId?: string | null; // To optionally filter out the current user from the list
}

export const OnlineUsersPanel: React.FC<OnlineUsersPanelProps> = ({ currentUserId }) => {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getDatabase(app);
    const onlineUsersRef = ref(db, 'onlineUsers');
    setIsLoading(true);

    const unsubscribe = onValue(
      onlineUsersRef,
      (snapshot) => {
        const usersData = snapshot.val();
        if (usersData) {
          const usersList: UserPresence[] = Object.values(usersData)
            // Optional: Filter out users with 'offline' status if we implement that
            .filter(user => (user as UserPresence).status === 'online')
            // Optional: Filter out the current user from this list
            .filter(user => currentUserId ? (user as UserPresence).uid !== currentUserId : true)
            .map(user => user as UserPresence);
          setOnlineUsers(usersList);
        } else {
          setOnlineUsers([]);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching online users:", err);
        setError("Could not load online users.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]); // Re-run if currentUserId changes

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading online users...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow">
      <h3 className="text-md font-semibold text-gray-800 mb-3">Who's Online ({onlineUsers.length})</h3>
      {onlineUsers.length === 0 ? (
        <p className="text-sm text-gray-500">No other users currently online.</p>
      ) : (
        <ul className="space-y-2">
          {onlineUsers.map((user) => (
            <li key={user.uid} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User avatar'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex items-center justify-center w-8 h-8 bg-gray-300 rounded-full">
                  <User size={18} className="text-gray-600" />
                </span>
              )}
              <div className="flex-1 min-w-0"> {/* Added for better truncation and layout */}
                <p className="text-sm font-medium text-gray-900 truncate" title={user.displayName || 'Anonymous User'}>
                  {user.displayName || 'Anonymous User'}
                </p>
                {user.currentFlowchartId && (
                  <p className="text-xs text-gray-500 truncate" title={`On: ${user.currentFlowchartId.replace('exercise-', 'Exercise ')}`}>
                    On: {user.currentFlowchartId.replace('exercise-', 'Exercise ')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
