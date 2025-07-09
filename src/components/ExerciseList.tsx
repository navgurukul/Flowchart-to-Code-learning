import React, { useState } from 'react';
import { Exercise, StudentProgress } from '../types/index';
import { CheckCircle, Circle, Star, ChevronDown, ChevronRight } from 'lucide-react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const completionPercentage = exercises.length > 0 ? (progress.completedExercises.length / exercises.length) * 100 : 0;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80">
      {/* Header */}
      <div
        className="p-4 border-b border-gray-200 cursor-pointer flex justify-between items-center"
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        aria-expanded={!isCollapsed}
        aria-controls="exercise-list-content" // Assuming the collapsible content will have this ID
      >
        <h2 className="text-lg font-bold text-gray-900">Programming Exercises</h2>
        {isCollapsed ? <ChevronRight className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div id="exercise-list-content"> {/* Added ID for aria-controls */}
          <div className="p-4">
            {/* Progress Overview */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Overall Progress</span>
                <span className="text-xs font-semibold text-gray-900">
                  {progress.completedExercises.length}/{exercises.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{completionPercentage.toFixed(0)}% Complete</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-emerald-50 p-2 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                  <span className="text-xs font-medium text-emerald-900">
                    {progress.completedExercises.length} Complete
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded-md">
                <div className="flex items-center">
                  <Star className="h-3.5 w-3.5 text-blue-600 mr-1.5" />
                  <span className="text-xs font-medium text-blue-900">
                    {progress.totalScore} Points
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Exercise List */}
          <div className="overflow-y-auto max-h-80 border-t border-gray-200"> {/* Added max-h and border */}
            <div className="p-3 space-y-2">
              {exercises.map((exercise) => {
                const isCompleted = progress.completedExercises.includes(exercise.id);
                const isCurrent = currentExercise === exercise.id;

                return (
                  <div
                    key={exercise.id}
                    onClick={() => onSelectExercise(exercise.id)}
                    className={`p-3 rounded-md border cursor-pointer transition-all duration-200 hover:shadow-sm ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50 shadow-xs'
                        : isCompleted
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1.5">
                          {isCompleted ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                          )}
                          <span className="text-xs font-medium text-gray-800">
                            Exercise {exercise.id}
                          </span>
                        </div>

                        <h3 className="font-semibold text-gray-800 mb-1 text-xs leading-tight">
                          {exercise.title}
                        </h3>

                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                          {exercise.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className={`text-xxs px-1.5 py-0.5 rounded-full font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty}
                          </span>

                          <span className="text-xxs text-gray-500">
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
        </>
      )}
    </div>
  );
};