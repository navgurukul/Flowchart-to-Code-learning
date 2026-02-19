import React from 'react';
import { Lesson } from '../data/lessons';
import { BookOpen, CheckCircle, Circle, Clock } from 'lucide-react';

interface LessonListProps {
  lessons: Lesson[];
  completedLessons: number[];
  currentLessonId: number | null;
  onSelectLesson: (lessonId: number) => void;
}

export const LessonList: React.FC<LessonListProps> = ({
  lessons,
  completedLessons,
  currentLessonId,
  onSelectLesson
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basics': return 'bg-green-100 text-green-700';
      case 'flowcharts': return 'bg-blue-100 text-blue-700';
      case 'logic': return 'bg-purple-100 text-purple-700';
      case 'advanced': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const completionPercentage = lessons.length > 0 
    ? (completedLessons.length / lessons.length) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center mb-3">
          <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Learning Materials</h2>
        </div>
        
        {/* Progress */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Progress</span>
            <span className="text-xs font-semibold text-gray-900">
              {completedLessons.length}/{lessons.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lesson List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {lessons.map((lesson) => {
          const isCompleted = completedLessons.includes(lesson.id);
          const isCurrent = currentLessonId === lesson.id;

          return (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                isCurrent
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : isCompleted
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">
                      Lesson {lesson.order}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(lesson.category)}`}>
                      {lesson.category}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {lesson.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {lesson.description}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{lesson.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
