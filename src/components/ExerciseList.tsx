import React from 'react';
import { Exercise, StudentProgress } from '../types/index';
import { CheckCircle, Circle, Star, Clock } from 'lucide-react';

interface ExerciseListProps {
  exercises: Exercise[];
  progress: StudentProgress;
  currentExercise: number;
  onSelectExercise: (exerciseId: number) => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  progress,
  currentExercise,
  onSelectExercise
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const completionPercentage = (progress.completedExercises.length / exercises.length) * 100;

  return (
    <div className="w-full sm:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Programming Exercises</h2>
        
        {/* Progress Overview */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Overall Progress</span>
            <span className="text-sm font-semibold text-gray-900">
              {progress.completedExercises.length}/{exercises.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{completionPercentage.toFixed(0)}% Complete</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 p-3 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
              <span className="text-sm font-medium text-emerald-900">
                {progress.completedExercises.length} Complete
              </span>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                {progress.totalScore} Points
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {exercises.map((exercise) => {
            const isCompleted = progress.completedExercises.includes(exercise.id);
            const isCurrent = currentExercise === exercise.id;
            
            return (
              <div
                key={exercise.id}
                onClick={() => onSelectExercise(exercise.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isCurrent 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400 mr-2" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        Exercise {exercise.id}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">
                      {exercise.title}
                    </h3>
                    
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {exercise.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                        {exercise.difficulty}
                      </span>
                      
                      <span className="text-xs text-gray-500">
                        {exercise.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};