import React, { useRef, useEffect, useState } from 'react';
import { Exercise, StudentProgress } from '../types/index';
import { CheckCircle, Lock, Zap } from 'lucide-react';

interface SnakeFlowExerciseMapProps {
  exercises: Exercise[];
  progress: StudentProgress;
  currentExerciseId: number | null;
  onSelectExercise: (exerciseId: number) => void;
  isDryRunMode?: boolean;
}

// Modern color palette
const NODE_COLORS = [
  { bg: '#2979FF', shadow: 'rgba(41, 121, 255, 0.3)', name: 'blue' },      // Ex 1 - Blue
  { bg: '#FF5252', shadow: 'rgba(255, 82, 82, 0.3)', name: 'red' },        // Ex 2 - Red
  { bg: '#FFB300', shadow: 'rgba(255, 179, 0, 0.3)', name: 'orange' },     // Ex 3 - Orange
  { bg: '#4CAF50', shadow: 'rgba(76, 175, 80, 0.3)', name: 'green' },      // Ex 4 - Green
  { bg: '#26A69A', shadow: 'rgba(38, 166, 154, 0.3)', name: 'teal' },      // Ex 5 - Teal
  { bg: '#5C6BC0', shadow: 'rgba(92, 107, 192, 0.3)', name: 'indigo' },    // Ex 6 - Indigo
  { bg: '#7E57C2', shadow: 'rgba(126, 87, 194, 0.3)', name: 'purple' },    // Ex 7 - Purple
  { bg: '#EC407A', shadow: 'rgba(236, 64, 122, 0.3)', name: 'pink' },      // Ex 8 - Pink
  { bg: '#B0BEC5', shadow: 'rgba(176, 190, 197, 0.3)', name: 'grey' },     // Ex 9+ - Grey
];

export const SnakeFlowExerciseMap: React.FC<SnakeFlowExerciseMapProps> = ({
  exercises,
  progress,
  currentExerciseId,
  onSelectExercise,
  isDryRunMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodePositions, setNodePositions] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  // Calculate node positions and update SVG
  useEffect(() => {
    if (!containerRef.current) return;

    const updatePositions = () => {
      const container = containerRef.current;
      if (!container) return;

      const positions = new Map<number, { x: number; y: number }>();
      const nodes = container.querySelectorAll('[data-node-id]');
      
      nodes.forEach((node) => {
        const id = parseInt(node.getAttribute('data-node-id') || '0');
        const rect = node.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate center position relative to container
        const x = rect.left - containerRect.left + rect.width / 2;
        const y = rect.top - containerRect.top + rect.height / 2;
        
        positions.set(id, { x, y });
      });

      setNodePositions(positions);
      setSvgDimensions({
        width: container.offsetWidth,
        height: container.offsetHeight,
      });
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    
    // Delay to ensure DOM is ready
    const timer = setTimeout(updatePositions, 100);

    return () => {
      window.removeEventListener('resize', updatePositions);
      clearTimeout(timer);
    };
  }, [exercises]);

  // Draw curved connection between two nodes
  const drawConnection = (fromId: number, toId: number, color: string, isCompleted: boolean) => {
    const from = nodePositions.get(fromId);
    const to = nodePositions.get(toId);

    if (!from || !to) return null;

    // Node radius for calculating arrow position
    const nodeRadius = 40; // Half of node width (80px / 2)
    const arrowOffset = 12; // Reduced offset for tighter fit

    // Calculate angle from 'from' to 'to' node
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    
    // Adjust start and end points to be at edge of circles
    const fromX = from.x + Math.cos(angle) * nodeRadius;
    const fromY = from.y + Math.sin(angle) * nodeRadius;
    const toX = to.x - Math.cos(angle) * (nodeRadius + arrowOffset);
    const toY = to.y - Math.sin(angle) * (nodeRadius + arrowOffset);

    // Calculate control points with natural variation (like a real snake)
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Add natural variation to curve offset based on node index
    // Creates organic snake movement - some curves tighter, some wider
    const variationPattern = [1.0, 0.8, 1.2, 0.9, 1.1, 0.85, 1.15, 0.95, 1.05];
    const variation = variationPattern[fromId % variationPattern.length];
    const baseCurveOffset = Math.min(distance * 0.35, 120);
    const curveOffset = baseCurveOffset * variation;
    
    // Control points for cubic Bezier curve with natural variation
    const cp1x = fromX + dx * 0.5 + (dy > 0 ? curveOffset : -curveOffset) * (dx > 0 ? 0.25 : -0.25);
    const cp1y = fromY + dy * 0.3;
    const cp2x = toX - dx * 0.5 + (dy > 0 ? curveOffset : -curveOffset) * (dx > 0 ? -0.25 : 0.25);
    const cp2y = toY - dy * 0.3;

    const pathD = `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;

    return (
      <g key={`connection-${fromId}-${toId}`}>
        <path
          d={pathD}
          stroke={isCompleted ? '#4CAF50' : color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd={`url(#arrow-${fromId})`}
          opacity={isCompleted ? 1 : 0.7}
          className="transition-all duration-500"
          style={{
            strokeDasharray: isCompleted ? '0' : '1000',
            strokeDashoffset: isCompleted ? '0' : '1000',
            animation: isCompleted ? 'none' : 'drawPath 1.5s ease-out forwards',
            animationDelay: `${fromId * 0.15}s`,
          }}
        />
      </g>
    );
  };

  const isExerciseLocked = (exerciseIndex: number): boolean => {
    if (exerciseIndex === 0) return false;
    const previousExerciseId = exercises[exerciseIndex - 1]?.id;
    if (previousExerciseId === undefined) return true;
    return !progress.completedExercises.includes(previousExerciseId);
  };

  const getNodeColor = (index: number) => {
    return NODE_COLORS[index % NODE_COLORS.length];
  };

  return (
    <div className="w-80 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Exercise Map</h2>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Progress: {progress.completedExercises.length}/{exercises.length}</span>
          <span>{progress.totalScore} pts</span>
        </div>
      </div>

      {/* Snake Flow Container */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-8 relative">
        {/* SVG Layer for Connections */}
        <svg
          ref={svgRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: svgDimensions.width,
            height: svgDimensions.height,
            zIndex: 0,
          }}
        >
          <defs>
            {/* Arrow markers for each node - smaller size */}
            {exercises.map((exercise, index) => {
              const color = getNodeColor(index);
              const isCompleted = progress.completedExercises.includes(exercise.id);
              return (
                <marker
                  key={`arrow-${exercise.id}`}
                  id={`arrow-${exercise.id}`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path
                    d="M0,0 L0,8 L7,4 z"
                    fill={isCompleted ? '#4CAF50' : color.bg}
                    opacity={isCompleted ? 0.9 : 0.65}
                  />
                </marker>
              );
            })}
          </defs>

          {/* Draw all connections */}
          {exercises.map((exercise, index) => {
            if (index === exercises.length - 1) return null;
            const color = getNodeColor(index);
            const isCompleted = progress.completedExercises.includes(exercise.id);
            return drawConnection(exercise.id, exercises[index + 1].id, color.bg, isCompleted);
          })}
        </svg>

        {/* Exercise Nodes */}
        <div className="relative space-y-16" style={{ zIndex: 1 }}>
          {exercises.map((exercise, index) => {
            const isLocked = isExerciseLocked(index);
            const isCompleted = progress.completedExercises.includes(exercise.id);
            const isCurrent = currentExerciseId === exercise.id;
            const isLeftAligned = index % 2 === 0;
            const color = getNodeColor(index);

            return (
              <div
                key={exercise.id}
                className={`flex ${isLeftAligned ? 'justify-start' : 'justify-end'}`}
              >
                <button
                  data-node-id={exercise.id}
                  onClick={() => !isLocked && !isDryRunMode && onSelectExercise(exercise.id)}
                  disabled={isLocked || isDryRunMode}
                  className={`
                    w-20 h-20 rounded-full flex flex-col items-center justify-center
                    transition-all duration-300 relative
                    ${isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:scale-110'}
                    ${isCurrent ? 'scale-110 animate-pulse-subtle' : ''}
                  `}
                  style={{
                    backgroundColor: isLocked ? '#B0BEC5' : isCompleted ? '#4CAF50' : color.bg,
                    boxShadow: isCurrent 
                      ? `0 8px 24px ${color.shadow}, 0 0 0 6px rgba(41, 121, 255, 0.15)`
                      : isLocked
                      ? '0 2px 8px rgba(176, 190, 197, 0.2)'
                      : `0 4px 12px ${color.shadow}`,
                  }}
                  title={`${exercise.title}${isLocked ? ' (Locked)' : ''}${isDryRunMode ? ' (Dry Run Active)' : ''}`}
                >
                  {/* Status Icons */}
                  {isLocked ? (
                    <Lock className="w-6 h-6 text-white mb-1" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-white mb-1" />
                  ) : isCurrent ? (
                    <Zap className="w-6 h-6 text-white mb-1 animate-bounce" />
                  ) : null}
                  
                  {/* Exercise Number */}
                  <span className="text-white font-bold text-sm">
                    Ex {exercise.id}
                  </span>

                  {/* Glow effect for current */}
                  {isCurrent && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${color.bg}40 0%, transparent 70%)`,
                        filter: 'blur(12px)',
                        zIndex: -1,
                        animation: 'pulse-glow 2s ease-in-out infinite',
                      }}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {/* CSS Animation */}
      <style>{`
        @keyframes drawPath {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1.1);
          }
          50% {
            transform: scale(1.15);
          }
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
