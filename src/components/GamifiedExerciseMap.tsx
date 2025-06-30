import React from 'react';
import { Exercise, StudentProgress } from '../types/index';
import { CheckCircle, Circle, Lock, Zap } from 'lucide-react';

interface GamifiedExerciseMapProps {
  exercises: Exercise[];
  progress: StudentProgress;
  currentExerciseId: number | null;
  onSelectExercise: (exerciseId: number) => void;
}

export const GamifiedExerciseMap: React.FC<GamifiedExerciseMapProps> = ({
  exercises,
  progress,
  currentExerciseId,
  onSelectExercise,
}) => {
  const isExerciseLocked = (exerciseId: number, exerciseIndex: number): boolean => {
    if (exerciseIndex === 0) return false; // First exercise is never locked
    const previousExerciseId = exercises[exerciseIndex - 1]?.id;
    if (previousExerciseId === undefined) return true; // Should not happen
    return !progress.completedExercises.includes(previousExerciseId);
  };

  const nodeSize = 64; // w-16, h-16
  const verticalSpacing = 40; // Spacing between rows
  const horizontalSpacing = 32; // Spacing between nodes in a row
  const nodesPerRow = 3; // Number of nodes in each row for the snake pattern

  const containerPadding = 24; // p-6 (6 * 4px = 24px)
  // Effective width for node placement needs to account for padding on one side if map isn't centered
  // For simplicity, assume mapWidth is the total usable width for the pattern.
  // Let's make the overall container slightly wider to accommodate 3 nodes comfortably.
  // If w-80 (320px) is the outer container, and p-6 (24px) is applied, usable width is 320 - 48 = 272px.
  // This 272px needs to fit `nodesPerRow` nodes and `nodesPerRow - 1` horizontal spacings.
  // (nodesPerRow * nodeSize) + (nodesPerRow - 1) * horizontalSpacing <= mapWidth
  // 3 * 64 + 2 * 32 = 192 + 64 = 256px. This fits within 272px.
  const mapWidth = (nodesPerRow * nodeSize) + ((nodesPerRow > 1 ? nodesPerRow - 1 : 0) * horizontalSpacing);
  const actualContainerWidth = mapWidth + containerPadding * 2; // For the outer div

  // Calculate positions for all nodes
  const nodePositions = exercises.map((_, index) => {
    const rowIndex = Math.floor(index / nodesPerRow);
    const colIndexInRow = index % nodesPerRow;

    const y = rowIndex * (nodeSize + verticalSpacing);

    let x;
    if (rowIndex % 2 === 0) { // Left-to-right row
      x = colIndexInRow * (nodeSize + horizontalSpacing);
    } else { // Right-to-left row
      x = (nodesPerRow - 1 - colIndexInRow) * (nodeSize + horizontalSpacing);
    }
    return { x, y };
  });

  const totalRows = Math.ceil(exercises.length / nodesPerRow);
  const svgHeight = totalRows * nodeSize + (totalRows > 0 ? (totalRows - 1) * verticalSpacing : 0) + nodeSize; // Extra nodeSize for padding

  return (
    <div
      className="bg-gray-50 border-r border-gray-200 flex flex-col h-full p-6 overflow-y-auto"
      style={{ width: `${actualContainerWidth}px` }} // Adjust width based on calculation
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Exercise Map</h2>
      <div className="relative" style={{ width: `${mapWidth}px`, margin: '0 auto' }}> {/* Centering the map area */}
        {/* SVG for drawing paths */}
        {exercises.length > 0 && (
          <svg
            className="absolute top-0 left-0"
            style={{
              width: `${mapWidth}px`,
              height: `${svgHeight}px`,
              zIndex: 0,
            }}
          >
            {exercises.map((exercise, index) => {
              if (index === exercises.length - 1) return null; // No path from the last node

              const currentPos = nodePositions[index];
              const nextPos = nodePositions[index+1];

              // Center of current node
              const currentX = currentPos.x + nodeSize / 2;
              const currentY = currentPos.y + nodeSize / 2;
              // Center of next node
              const nextX = nextPos.x + nodeSize / 2;
              const nextY = nextPos.y + nodeSize / 2;

              const rowIndexCurrent = Math.floor(index / nodesPerRow);
              const rowIndexNext = Math.floor((index + 1) / nodesPerRow);
              const isSameRow = rowIndexCurrent === rowIndexNext;

              let pathD = '';
              const curveFactor = verticalSpacing * 0.6; // Adjust for smoother curves

              if (isSameRow) {
                // Simple horizontal line for nodes in the same row
                pathD = `M${currentX},${currentY} L${nextX},${nextY}`;
              } else {
                // Inter-row connection (end of one row to start of next)
                // This needs a more S-like curve or a stepped approach.
                // Path: Move vertically, then horizontally, then vertically.
                // Control points for a cubic bezier:
                // c1: (currentX, currentY + curveFactor) - moves vertically down from current
                // c2: (nextX, nextY - curveFactor) - moves vertically up towards next
                pathD = `M${currentX},${currentY} C ${currentX},${currentY + curveFactor} ${nextX},${nextY - curveFactor} ${nextX},${nextY}`;
              }

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

        {/* Nodes wrapper - using absolute positioning for nodes */}
        <div className="relative" style={{ width: `${mapWidth}px`, height: `${svgHeight}px` }}>
          {exercises.map((exercise, index) => {
            const isLocked = isExerciseLocked(exercise.id, index);
            const isCompleted = progress.completedExercises.includes(exercise.id);
            const isCurrent = currentExerciseId === exercise.id;
            const position = nodePositions[index];

            let statusIcon;
            let nodeColor = 'bg-white hover:bg-gray-100';
            let textColor = 'text-gray-700';
            let borderColor = 'border-gray-300';
            let cursorStyle = 'cursor-pointer';

            if (isLocked) {
              statusIcon = <Lock size={20} className="text-gray-400" />;
              nodeColor = 'bg-gray-200';
              textColor = 'text-gray-500';
              borderColor = 'border-gray-300';
              cursorStyle = 'cursor-not-allowed';
            } else if (isCompleted) {
              statusIcon = <CheckCircle size={20} className="text-green-500" />;
              nodeColor = 'bg-green-50 hover:bg-green-100';
              textColor = 'text-green-700';
              borderColor = 'border-green-400';
            } else { // Unlocked but not completed
              statusIcon = <Circle size={20} className="text-blue-500" />;
              nodeColor = 'bg-blue-50 hover:bg-blue-100';
              textColor = 'text-blue-700';
              borderColor = 'border-blue-400';
            }

            if (isCurrent) {
              statusIcon = <Zap size={20} className="text-yellow-500" />;
              nodeColor = 'bg-yellow-100';
              borderColor = 'border-yellow-500 ring-2 ring-yellow-400';
              textColor = 'text-yellow-800 font-semibold';
            }

            const handleNodeClick = () => {
              if (!isLocked) {
                onSelectExercise(exercise.id);
              } else {
                console.log(`Exercise ${exercise.id} (${exercise.title}) is locked.`);
              }
            };

            return (
              <div
                key={exercise.id}
                onClick={handleNodeClick}
                className={`absolute w-16 h-16 rounded-full border-2 ${borderColor} ${nodeColor} ${cursorStyle} flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-all duration-150`}
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  zIndex: 1
                }} // Nodes above SVG
                title={`${exercise.title}${isLocked ? ' (Locked)' : ''}`}
              >
                {statusIcon}
                <span className={`mt-1 text-xs font-medium ${textColor}`}>
                  Ex {exercise.id}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
