import React from 'react';
import { StudentProgress } from '../types/index';
import { User, Trophy, Target, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // Adjusted path

interface HeaderProps {
  progress: StudentProgress; // This might become dynamic based on auth user later
}

export const Header: React.FC<HeaderProps> = ({ progress }) => {
  const { currentUser, signInWithGoogle, signOut, loading } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-2 mr-4">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Flowchart Programming Academy
            </h1>
            <p className="text-sm text-gray-600">
              Master flowchart-to-code translation through hands-on practice
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Stats - These would ideally also be tied to the currentUser */}
          {currentUser && ( // Only show stats if a user is logged in for now
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Trophy className="w-4 h-4 text-yellow-600 mr-1" />
                <span className="text-sm font-medium text-gray-700">
                  {progress.totalScore} pts
                </span>
              </div>

              <div className="flex items-center">
                <Target className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-sm font-medium text-gray-700">
                  {progress.completedExercises.length}/50 complete
                </span>
              </div>

              <div className="flex items-center">
                <Clock className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm font-medium text-gray-700">
                  Last active: {new Date(progress.lastAccessedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Auth Section */}
          <div className="flex items-center">
            {loading ? (
              <p className="text-sm text-gray-700">Loading...</p>
            ) : currentUser ? (
              <>
                <div className="flex items-center mr-4">
                  <User className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {currentUser.displayName || currentUser.email || currentUser.uid}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded text-sm transition-colors duration-150"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded text-sm transition-colors duration-150"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};