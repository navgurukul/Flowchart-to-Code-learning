import React from 'react';
import { StudentProgress } from '../types/index';
import { User, Trophy, Target, Clock } from 'lucide-react';

interface HeaderProps {
  progress: StudentProgress;
}

export const Header: React.FC<HeaderProps> = ({ progress }) => {
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
          {/* Stats */}
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

          {/* User Profile */}
          <div className="flex items-center">
            <div className="bg-gray-100 rounded-full p-2">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Student</p>
              <p className="text-xs text-gray-500">Learning Mode</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};