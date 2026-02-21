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
            <stop offset="0%" className={snake.color.split(' ')[0].replace('from-', 'stop-')} />
            <stop offset="100%" className={snake.color.split(' ')[2].replace('to-', 'stop-')} />
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
      <div className="p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2 text-center">
          🎮 Exercise Quest
        </h2>
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="font-semibold">{progress.completedExercises.length}/{exercises.length}</span>
          </div>
          <div className="flex items-center">
            <Trophy className="w-4 h-4 text-yellow-600 mr-1" />
            <span className="font-semibold">{progress.totalScore} pts</span>
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
