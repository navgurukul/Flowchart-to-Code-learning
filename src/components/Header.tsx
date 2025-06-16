import React, { useState } from 'react';
import { StudentProgress } from '../types'; // Ensure this path is correct
import { User, Trophy, Target, Clock, HelpCircle } from 'lucide-react'; // Added HelpCircle
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  progress: StudentProgress;
  onOpenGuide: () => void; // Added prop for opening guide
  onSetAppMode: (mode: 'normal' | 'learn' | 'generate') => void; // New prop
}

export const Header: React.FC<HeaderProps> = ({ progress, onOpenGuide, onSetAppMode }) => {
  const { currentUser, signInWithGoogle, signOut, loading } = useAuth();
  const [isModesMenuOpen, setIsModesMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3"> {/* Adjusted padding for smaller screens */}
      <div className="flex items-center justify-between">
        {/* Left Section: Logo and Title */}
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-2 mr-3 sm:mr-4">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              Flowchart Academy
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 hidden md:block"> {/* Hidden on very small screens */}
              Visual Logic to Code
            </p>
          </div>
        </div>

        {/* Right Section: Stats, Auth, and Guide Button */}
        <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
          {/* Stats - Conditionally render based on user and screen size */}
          {currentUser && (
            <div className="hidden lg:flex items-center space-x-3 md:space-x-4"> {/* Hidden on smaller than lg */}
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

          {/* Auth Section & Guide Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {loading ? (
              <p className="text-xs sm:text-sm text-gray-700">Loading...</p>
            ) : currentUser ? (
              <>
                <div className="flex items-center" title={currentUser.displayName || currentUser.email || currentUser.uid}>
                  <User className="w-5 h-5 text-gray-600 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 hidden md:inline"> {/* Hide name on small screens */}
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <button
                  onClick={signOut}
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

            <div className="relative"> {/* Needed for dropdown positioning later */}
              <button
                onClick={() => setIsModesMenuOpen(!isModesMenuOpen)}
                className={`font-medium py-1.5 px-2 sm:py-2 sm:px-3 rounded text-xs sm:text-sm transition-colors duration-150 ${
                  isModesMenuOpen
                    ? 'bg-blue-100 text-blue-700' // Style when open
                    : 'text-gray-500 hover:bg-blue-100 hover:text-blue-600' // Style when closed
                }`}
                title="Select Mode"
              >
                Modes
              </button>
              {isModesMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Learn by Topic clicked');
                      onSetAppMode('learn'); // Set app mode
                      setIsModesMenuOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    Learn by Topic
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Generate by Name clicked');
                      onSetAppMode('generate'); // Set app mode
                      setIsModesMenuOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    Generate by Name
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={onOpenGuide}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-150"
              title="Show Application Guide"
              aria-label="Show Application Guide"
            >
              <HelpCircle size={20} /> {/* Adjusted size for consistency */}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};