import React from 'react';
import { Exercise, StudentProgress } from '../types/index';
import { CheckCircle, Circle, Lock, Zap } from 'lucide-react';

interface GamifiedExerciseMapProps {
  exercises: Exercise[];
  progress: StudentProgress;
  currentExerciseId: number | null;
  onSelectExercise: (exerciseId: number) => void;
  isDryRunMode?: boolean; // Added to disable clicks during dry run
}

export const GamifiedExerciseMap: React.FC<GamifiedExerciseMapProps> = ({
  exercises,
  progress,
  currentExerciseId,
  onSelectExercise,
  isDryRunMode = false, // Default to false
}) => {
  const isExerciseLocked = (exerciseId: number, exerciseIndex: number): boolean => {
    // In dry run mode, consider all exercises "accessible" for selection for the map's purpose,
    // but clicks will be globally disabled if needed, or handled by onSelectExercise in App.tsx.
    // However, the visual "lock" should still reflect actual progress.
    // The main concern is preventing onSelectExercise if isDryRunMode is true, which App.tsx now handles.
    if (exerciseIndex === 0) return false; // First exercise is never locked
    const previousExerciseId = exercises[exerciseIndex - 1]?.id;
    if (previousExerciseId === undefined) return true; // Should not happen
    return !progress.completedExercises.includes(previousExerciseId);
  };

  const nodeSize = 64; // Corresponds to w-16, h-16 -> 16 * 4px = 64px
  const verticalSpacing = 16; // Corresponds to space-y-4 -> 4 * 4px = 16px
  const containerPadding = 24 * 2; // p-6 on each side, 6 * 4px = 24px
  const mapWidth = 320 - containerPadding; // w-80 is 320px. 320 - 48 = 272px

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full p-6 overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Exercise Map</h2>
      <div className="relative"> {/* Container for nodes and SVG path */}
        {/* SVG for drawing paths */}
        {exercises.length > 0 && (
          <svg
            className="absolute top-0 left-0 w-full h-full"
            style={{
              zIndex: 0,
              // Height of SVG needs to be enough for all nodes and their spacing
              // Last node doesn't have spacing after it, so subtract one verticalSpacing
              height: `${exercises.length * nodeSize + (exercises.length > 0 ? (exercises.length - 1) * verticalSpacing : 0)}px`,
            }}
          >
            {exercises.map((exercise, index) => {
              if (index === exercises.length - 1) return null; // No path from the last node

              const isCurrentNodeOnLeft = index % 2 === 0;

              // X coordinates for node centers
              // We want nodes to be at 25% and 75% of the mapWidth
              const xPosLeft = mapWidth / 4;
              const xPosRight = mapWidth * (3/4);

              const currentX = isCurrentNodeOnLeft ? xPosLeft : xPosRight;
              // Y coordinate for the center of the current node
              const currentY = (nodeSize / 2) + (index * (nodeSize + verticalSpacing));

              const nextX = !isCurrentNodeOnLeft ? xPosLeft : xPosRight;
              // Y coordinate for the center of the next node
              const nextY = (nodeSize / 2) + ((index + 1) * (nodeSize + verticalSpacing));

              // Control point for Quadratic Bezier Curve
              // For a smooth "S" curve, the control point should be horizontally in the middle
              // and vertically halfway between the current and next node.
              const controlX = mapWidth / 2;
              const controlY = (currentY + nextY) / 2;

              const pathD = `M${currentX},${currentY} Q${controlX},${controlY} ${nextX},${nextY}`;

              return (
                <path
                  key={`path-${exercise.id}`}
                  d={pathD}
                  stroke="#CBD5E1" // tailwind gray-300
                  strokeWidth="3"
                  fill="none"
                />
              );
            })}
          </svg>
        )}

        {/* Nodes wrapper - this div will manage the vertical spacing equivalent to space-y-4 */}
        <div className="flex flex-col" style={{ gap: `${verticalSpacing}px` }}>
          {exercises.map((exercise, index) => {
            const isLocked = isExerciseLocked(exercise.id, index);
            const isCompleted = progress.completedExercises.includes(exercise.id);
            const isCurrent = currentExerciseId === exercise.id;

            let statusIcon;
            let nodeColor = 'bg-white hover:bg-gray-100';
            let textColor = 'text-gray-700';
            let borderColor = 'border-gray-300';
            let cursorStyle = 'cursor-pointer';

            if (isDryRunMode) {
              cursorStyle = 'cursor-default'; // Indicate non-interactive if in dry run mode
            }

            if (isLocked) {
              statusIcon = <Lock size={20} className="text-gray-400" />;
              nodeColor = 'bg-gray-200'; // Default locked color
              textColor = 'text-gray-500';
              borderColor = 'border-gray-300';
              if (!isDryRunMode) cursorStyle = 'cursor-not-allowed'; // Only "not-allowed" if not in dry run
            } else if (isCompleted) {
              statusIcon = <CheckCircle size={20} className="text-green-500" />;
              nodeColor = 'bg-green-50 hover:bg-green-100'; // Default completed color
              textColor = 'text-green-700';
              borderColor = 'border-green-400';
            } else { // Unlocked but not completed
              statusIcon = <Circle size={20} className="text-blue-500" />;
              nodeColor = 'bg-blue-50 hover:bg-blue-100'; // Default unlocked color
              textColor = 'text-blue-700';
              borderColor = 'border-blue-400';
            }

            // Current exercise highlight overrides other color/status if applicable
            if (isCurrent) {
              statusIcon = <Zap size={20} className="text-yellow-500" />; // Current icon
              // Keep underlying lock/complete status color but add current indicator
              nodeColor = isLocked ? 'bg-gray-300' : isCompleted ? 'bg-green-200' : 'bg-blue-200'; // Slightly darker shade for current
              nodeColor = `${nodeColor} hover:brightness-110`; // General hover for current
              borderColor = 'border-yellow-500 ring-2 ring-yellow-400'; // Prominent border for current
              textColor = 'text-yellow-800 font-semibold'; // Special text for current
            }


            const handleNodeClick = () => {
              // App.tsx's onSelectExercise already checks for isDryRunMode.
              // This local check is mostly for the console log and visual cursor.
              if (isDryRunMode) {
                console.log("Exercise selection is disabled during Dry Run mode.");
                return;
              }
              if (!isLocked) {
                onSelectExercise(exercise.id);
              } else {
                console.log(`Exercise ${exercise.id} (${exercise.title}) is locked.`);
              }
            };

            const isNodeOnLeft = index % 2 === 0;
            // Use 'items-start' or 'items-end' on the flex container for the node row
            // The circular node itself is then pushed by a margin.
            // For a 272px wide area:
            // Left (25%): target center is 68px. Node (64px wide) left edge at 68 - 32 = 36px.
            // Right (75%): target center is 204px. Node (64px wide) left edge at 204 - 32 = 172px.
            const alignmentClass = isNodeOnLeft ? 'justify-start' : 'justify-end';

            // We need to calculate margin to place the node at 25% or 75%
            // If node is on left (25% mark), its container is justify-start. Margin is needed from left.
            // Margin = (mapWidth / 4) - (nodeSize / 2)
            // If node is on right (75% mark), its container is justify-end. Margin is needed from right.
            // Margin = (mapWidth / 4) - (nodeSize / 2)
            // This is because 75% from left means 25% from right.
            const horizontalMargin = (mapWidth / 4) - (nodeSize / 2);


            return (
              <div
                key={exercise.id}
                onClick={handleNodeClick}
                className={`relative flex ${alignmentClass} w-full`}
                style={{ zIndex: 1 }} // Nodes above SVG
              >
                <div
                  className={`w-16 h-16 rounded-full border-2 ${borderColor} ${nodeColor} ${cursorStyle}
                              flex flex-col items-center justify-center shadow-md hover:shadow-lg
                              transition-all duration-150`}
                  title={`${exercise.title}${isLocked && !isCurrent ? ' (Locked)' : ''}${isDryRunMode ? ' (Dry Run Active)' : ''}`}
                  style={ isNodeOnLeft ? { marginLeft: `${horizontalMargin}px` } : { marginRight: `${horizontalMargin}px`} }
                >
                  {statusIcon}
                  <span className={`mt-1 text-xs font-medium ${textColor} text-center px-1 truncate w-full`}>
                    Ex {exercise.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
