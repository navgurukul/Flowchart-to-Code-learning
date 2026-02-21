import React, { useRef, useEffect } from 'react';
import { Exercise, StudentProgress } from '../types/index';
import { CheckCircle, Lock, Trophy, Zap, Star } from 'lucide-react';

interface GamifiedExerciseMapProps {
  exercises: Exercise[];
  progress: StudentProgress;
  currentExerciseId: number | null;
  onSelectExercise: (exerciseId: number) => void;
  isDryRunMode?: boolean;
}

// Define ladder positions (from exercise -> to exercise)
const LADDERS = [
  { from: 5, to: 15, color: 'from-purple-500 to-blue-500' },
  { from: 22, to: 42, color: 'from-blue-500 to-cyan-500' },
  { from: 35, to: 48, color: 'from-pink-500 to-purple-500' },
];

// Define snake positions (from exercise -> to exercise)
const SNAKES = [
  { from: 16, to: 6, color: 'from-orange-500 to-red-500' },
  { from: 45, to: 25, color: 'from-red-500 to-orange-600' },
];

export const GamifiedExerciseMapV2: React.FC<GamifiedExerciseMapProps> = ({
  exercises,
  progress,
  currentExerciseId,
  onSelectExercise,
  isDryRunMode = false,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const currentExerciseRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current exercise
  useEffect(() => {
    if (currentExerciseRef.current && canvasRef.current) {
      currentExerciseRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentExerciseId]);

  const isExerciseLocked = (exerciseId: number, exerciseIndex: number): boolean => {
    if (exerciseIndex === 0) return false;
    const previousExerciseId = exercises[exerciseIndex - 1]?.id;
    if (previousExerciseId === undefined) return true;
    return !progress.completedExercises.includes(previousExerciseId);
  };

  // Calculate position along the snake path
  const getPositionForIndex = (index: number) => {
    const tilesPerRow = 5;
    const row = Math.floor(index / tilesPerRow);
    const col = index % tilesPerRow;
    
    // Alternate direction for snake pattern
    const isReversedRow = row % 2 === 1;
    const actualCol = isReversedRow ? tilesPerRow - 1 - col : col;
    
    return { row, col: actualCol };
  };

  const renderLadder = (ladder: typeof LADDERS[0]) => {
    const fromPos = getPositionForIndex(ladder.from - 1);
    const toPos = getPositionForIndex(ladder.to - 1);
    
    return (
      <div
        key={`ladder-${ladder.from}-${ladder.to}`}
        className="absolute pointer-events-none z-10"
        style={{
          left: `${fromPos.col * 20 + 10}%`,
          top: `${fromPos.row * 120 + 60}px`,
          width: '40px',
          height: `${(fromPos.row - toPos.row) * 120}px`,
        }}
      >
        <div className={`w-full h-full bg-gradient-to-b ${ladder.color} rounded-lg opacity-80 relative`}>
          {/* Ladder rungs */}
          {[...Array(Math.abs(fromPos.row - toPos.row) + 1)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-1 bg-white/50"
              style={{ top: `${(i / (Math.abs(fromPos.row - toPos.row) + 1)) * 100}%` }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderSnake = (snake: typeof SNAKES[0]) => {
    const fromPos = getPositionForIndex(snake.from - 1);
    const toPos = getPositionForIndex(snake.to - 1);
    
    // Extract colors from gradient string
    const getColorFromGradient = (gradientStr: string, position: 'from' | 'to') => {
      const parts = gradientStr.split(' ');
      if (position === 'from') {
        const fromColor = parts.find(p => p.startsWith('from-'));
        return fromColor ? fromColor.replace('from-', '') : 'orange-500';
      } else {
        const toColor = parts.find(p => p.startsWith('to-'));
        return toColor ? toColor.replace('to-', '') : 'red-500';
      }
    };
    
    const fromColor = getColorFromGradient(snake.color, 'from');
    const toColor = getColorFromGradient(snake.color, 'to');
    
    // Map Tailwind colors to hex
    const colorMap: Record<string, string> = {
      'orange-500': '#f97316',
      'red-500': '#ef4444',
      'red-600': '#dc2626',
      'orange-600': '#ea580c',
    };
    
    return (
      <svg
        key={`snake-${snake.from}-${snake.to}`}
        className="absolute pointer-events-none z-10"
        style={{
          left: `${Math.min(fromPos.col, toPos.col) * 20}%`,
          top: `${Math.min(fromPos.row, toPos.row) * 120}px`,
          width: `${Math.abs(fromPos.col - toPos.col) * 20 + 20}%`,
          height: `${Math.abs(fromPos.row - toPos.row) * 120 + 100}px`,
        }}
      >
        <defs>
          <linearGradient id={`snakeGradient-${snake.from}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorMap[fromColor] || '#f97316'} />
            <stop offset="100%" stopColor={colorMap[toColor] || '#ef4444'} />
          </linearGradient>
        </defs>
        <path
          d={`M ${fromPos.col < toPos.col ? 10 : 90} ${fromPos.row < toPos.row ? 10 : 90} 
              Q ${50} ${50} 
              ${toPos.col < fromPos.col ? 10 : 90} ${toPos.row < fromPos.row ? 10 : 90}`}
          stroke={`url(#snakeGradient-${snake.from})`}
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    );
  };

  return (
    <div className="w-80 bg-gradient-to-b from-blue-50 to-purple-50 border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 border-b border-purple-700 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10">
          {/* Title with icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-3 shadow-lg">
              <Trophy className="w-6 h-6 text-yellow-300 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">
              Exercise Quest
            </h2>
          </div>
          
          {/* Progress Stats */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-xl">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-white/90 mb-2">
                <span className="font-semibold">Progress</span>
                <span className="font-bold">{progress.completedExercises.length}/{exercises.length}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                  style={{ width: `${(progress.completedExercises.length / exercises.length) * 100}%` }}
                >
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Completed */}
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-white">{progress.completedExercises.length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              
              {/* Total Points */}
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70 mb-1">Points</p>
                    <p className="text-2xl font-bold text-yellow-300">{progress.totalScore}</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
            </div>
            
            {/* Motivational Message */}
            <div className="mt-3 text-center">
              <p className="text-xs text-white/80 font-medium">
                {progress.completedExercises.length === 0 
                  ? "🚀 Start your journey!" 
                  : progress.completedExercises.length === exercises.length
                  ? "🎉 Quest Complete! You're a champion!"
                  : progress.completedExercises.length < 10
                  ? "💪 Keep going! You're doing great!"
                  : progress.completedExercises.length < 25
                  ? "🔥 You're on fire! Halfway there!"
                  : "⭐ Almost there! Finish strong!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Game Board */}
      <div ref={canvasRef} className="flex-1 overflow-y-auto p-6 relative">
        {/* Check if exercises exist */}
        {!exercises || exercises.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No exercises available</p>
          </div>
        ) : (
          <>
            {/* SVG Path Background */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {exercises.map((_, index) => {
            if (index === exercises.length - 1) return null;
            const currentPos = getPositionForIndex(index);
            const nextPos = getPositionForIndex(index + 1);
            
            const x1 = currentPos.col * 20 + 10;
            const y1 = currentPos.row * 120 + 60;
            const x2 = nextPos.col * 20 + 10;
            const y2 = nextPos.row * 120 + 60;
            
            const isCompleted = progress.completedExercises.includes(exercises[index].id);
            
            return (
              <line
                key={`path-${index}`}
                x1={`${x1}%`}
                y1={y1}
                x2={`${x2}%`}
                y2={y2}
                stroke={isCompleted ? '#10B981' : 'url(#pathGradient)'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={isCompleted ? '0' : '8,4'}
              />
            );
          })}
        </svg>

        {/* Ladders */}
        {LADDERS.map(renderLadder)}

        {/* Snakes */}
        {SNAKES.map(renderSnake)}

        {/* Exercise Tiles */}
        <div className="relative" style={{ minHeight: `${Math.ceil(exercises.length / 5) * 120}px` }}>
          {exercises.map((exercise, index) => {
            const isLocked = isExerciseLocked(exercise.id, index);
            const isCompleted = progress.completedExercises.includes(exercise.id);
            const isCurrent = currentExerciseId === exercise.id;
            const position = getPositionForIndex(index);
            
            // Check if this is a ladder or snake tile
            const isLadderStart = LADDERS.some(l => l.from === exercise.id);
            const isSnakeHead = SNAKES.some(s => s.from === exercise.id);
            
            // Final trophy tile
            const isFinalTile = index === exercises.length - 1;

            return (
              <div
                key={exercise.id}
                ref={isCurrent ? currentExerciseRef : null}
                className="absolute transition-all duration-300"
                style={{
                  left: `${position.col * 20}%`,
                  top: `${position.row * 120}px`,
                  width: '18%',
                }}
              >
                <button
                  onClick={() => !isLocked && !isDryRunMode && onSelectExercise(exercise.id)}
                  disabled={isLocked || isDryRunMode}
                  className={`
                    w-full aspect-square rounded-2xl transition-all duration-300 relative
                    ${isFinalTile 
                      ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl shadow-yellow-500/50 animate-pulse' 
                      : isLocked
                        ? 'bg-gray-300 cursor-not-allowed'
                        : isCompleted
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30'
                          : 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30 hover:scale-110'
                    }
                    ${isCurrent ? 'ring-4 ring-yellow-400 ring-offset-2 scale-110' : ''}
                    ${!isLocked && !isDryRunMode ? 'hover:shadow-2xl cursor-pointer' : ''}
                  `}
                  title={`${exercise.title}${isLocked ? ' (Locked)' : ''}${isDryRunMode ? ' (Dry Run Active)' : ''}`}
                >
                  {/* Tile Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                    {isFinalTile ? (
                      <>
                        <Trophy className="w-8 h-8 text-white mb-1" />
                        <span className="text-xs font-bold text-white">FINISH!</span>
                      </>
                    ) : isLocked ? (
                      <>
                        <Lock className="w-6 h-6 text-gray-500 mb-1" />
                        <span className="text-xs font-semibold text-gray-600">Ex {exercise.id}</span>
                      </>
                    ) : (
                      <>
                        {isCompleted && <CheckCircle className="w-5 h-5 text-white absolute top-1 right-1" />}
                        {isCurrent && <Zap className="w-5 h-5 text-yellow-300 absolute top-1 left-1 animate-bounce" />}
                        <span className="text-2xl font-bold text-white">{exercise.id}</span>
                        <span className="text-xs font-medium text-white/90 text-center line-clamp-2 mt-1">
                          {exercise.title ? exercise.title.split(' ').slice(0, 2).join(' ') : `Ex ${exercise.id}`}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Special Indicators */}
                  {isLadderStart && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs">🪜</span>
                    </div>
                  )}
                  {isSnakeHead && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs">🐍</span>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>

      {/* Legend */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200 text-xs space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span>Locked</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg">🪜</span>
          <span>Ladder (Boost)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg">🐍</span>
          <span>Snake (Penalty)</span>
        </div>
      </div>
    </div>
  );
};
