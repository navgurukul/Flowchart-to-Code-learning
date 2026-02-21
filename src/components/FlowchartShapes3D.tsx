import React, { useState, useRef, useEffect } from 'react';

interface FlowchartShape3DProps {
  type: 'start' | 'process' | 'decision' | 'input' | 'output' | 'end';
  label?: string;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const FlowchartShape3D: React.FC<FlowchartShape3DProps> = ({
  type,
  label,
  animate = true,
  size = 'md',
  interactive = false,
}) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-24 h-16',
    md: 'w-32 h-20',
    lg: 'w-40 h-24',
  };

  const animationClass = animate && !isDragging ? 'hover:scale-110 hover:-translate-y-2' : '';

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      setRotation(prev => ({
        x: prev.x + deltaY * 0.5,
        y: prev.y + deltaX * 0.5,
      }));
      
      setStartPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startPos, interactive]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const transformStyle = interactive
    ? {
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d' as const,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      }
    : {};

  const renderShape = () => {
    switch (type) {
      case 'start':
      case 'end':
        return (
          <div 
            ref={containerRef}
            className={`${sizeClasses[size]} ${animationClass} transition-all duration-300 relative group`}
            style={transformStyle}
            onMouseDown={handleMouseDown}
          >
            {/* 3D Oval with depth layers */}
            <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
              {/* Back layers for depth */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full"
                  style={{
                    transform: `translateZ(${-i * 3}px)`,
                    opacity: 1 - i * 0.1,
                    transformStyle: 'preserve-3d',
                  }}
                />
              ))}
              {/* Front face */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full shadow-2xl" style={{ transform: 'translateZ(0px)', transformStyle: 'preserve-3d' }}>
                <div className="absolute top-2 left-1/4 w-1/2 h-1/4 bg-white/30 rounded-full blur-sm"></div>
              </div>
            </div>
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translateZ(2px)', transformStyle: 'preserve-3d' }}>
              <span className="text-white font-bold text-sm drop-shadow-lg z-10">
                {label || (type === 'start' ? 'START' : 'END')}
              </span>
            </div>
            {interactive && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                Drag to rotate
              </div>
            )}
          </div>
        );

      case 'process':
        return (
          <div 
            ref={containerRef}
            className={`${sizeClasses[size]} ${animationClass} transition-all duration-300 relative group`}
            style={transformStyle}
            onMouseDown={handleMouseDown}
          >
            {/* 3D Box with depth layers */}
            <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
              {/* Back layers for depth */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg"
                  style={{
                    transform: `translateZ(${-i * 3}px)`,
                    opacity: 1 - i * 0.1,
                    transformStyle: 'preserve-3d',
                  }}
                />
              ))}
              {/* Front face */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-2xl" style={{ transform: 'translateZ(0px)', transformStyle: 'preserve-3d' }}>
                <div className="absolute top-3 left-1/4 w-1/2 h-1/4 bg-white/30 rounded blur-sm"></div>
              </div>
            </div>
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translateZ(2px)', transformStyle: 'preserve-3d' }}>
              <span className="text-white font-semibold text-xs text-center px-2 drop-shadow-lg z-10">
                {label || 'PROCESS'}
              </span>
            </div>
            {interactive && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                Drag to rotate
              </div>
            )}
          </div>
        );

      case 'decision':
        return (
          <div 
            ref={containerRef}
            className={`${sizeClasses[size]} ${animationClass} transition-all duration-300 relative group`}
            style={transformStyle}
            onMouseDown={handleMouseDown}
          >
            {/* 3D Diamond with depth */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
              <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d' }}>
                {/* Back layers */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 transform rotate-45 rounded-lg"
                    style={{
                      transform: `rotate(45deg) translateZ(${-i * 3}px)`,
                      opacity: 1 - i * 0.1,
                      transformStyle: 'preserve-3d',
                    }}
                  />
                ))}
                {/* Front face */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 transform rotate-45 shadow-2xl rounded-lg" style={{ transform: 'rotate(45deg) translateZ(0px)', transformStyle: 'preserve-3d' }}>
                  <div className="absolute top-2 left-1/4 w-1/2 h-1/4 bg-white/40 rounded blur-sm"></div>
                </div>
              </div>
            </div>
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translateZ(2px)', transformStyle: 'preserve-3d' }}>
              <span className="text-white font-bold text-xs text-center px-2 drop-shadow-lg z-20">
                {label || 'DECISION?'}
              </span>
            </div>
            {interactive && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                Drag to rotate
              </div>
            )}
          </div>
        );

      case 'input':
      case 'output':
        return (
          <div 
            ref={containerRef}
            className={`${sizeClasses[size]} ${animationClass} transition-all duration-300 relative group`}
            style={transformStyle}
            onMouseDown={handleMouseDown}
          >
            {/* 3D Parallelogram with depth */}
            <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
              {/* Back layers for depth */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 transform skew-x-12 rounded-lg"
                  style={{
                    transform: `skewX(12deg) translateZ(${-i * 3}px)`,
                    opacity: 1 - i * 0.1,
                    transformStyle: 'preserve-3d',
                  }}
                />
              ))}
              {/* Front face */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 shadow-2xl transform skew-x-12 rounded-lg" style={{ transform: 'skewX(12deg) translateZ(0px)', transformStyle: 'preserve-3d' }}>
                <div className="absolute top-3 left-1/4 w-1/2 h-1/4 bg-white/30 rounded blur-sm"></div>
              </div>
            </div>
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center transform skew-x-12" style={{ transform: 'skewX(12deg) translateZ(2px)', transformStyle: 'preserve-3d' }}>
              <span className="text-white font-semibold text-xs text-center px-2 drop-shadow-lg z-10 transform -skew-x-12">
                {label || (type === 'input' ? 'INPUT' : 'OUTPUT')}
              </span>
            </div>
            {interactive && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                Drag to rotate
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return renderShape();
};

// Component to show all flowchart shapes
export const FlowchartShapesShowcase: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 space-y-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        📊 Interactive Flowchart Symbols
      </h3>
      <p className="text-center text-gray-600 mb-8">
        🖱️ Drag any shape to rotate and view from all angles!
      </p>

      {/* AR Coming Soon Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white shadow-lg mb-8">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <span className="text-3xl">📱</span>
          <h4 className="text-xl font-bold">Android AR Experience Coming Soon!</h4>
          <span className="text-3xl">✨</span>
        </div>
        <p className="text-center text-purple-100 text-sm">
          View these flowchart shapes in Augmented Reality on your Android phone. 
          Place them in your room, walk around them, and understand their 3D structure like never before!
        </p>
        <div className="flex justify-center mt-4">
          <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
            🚀 Stay tuned for the mobile app launch
          </span>
        </div>
      </div>

      {/* Start/End */}
      <div className="flex flex-col items-center space-y-4 py-4">
        <FlowchartShape3D type="start" size="lg" interactive={true} />
        <div className="text-center">
          <h4 className="font-bold text-gray-800">Start/End (Terminal)</h4>
          <p className="text-sm text-gray-600">Marks the beginning or end of a flowchart</p>
        </div>
      </div>

      {/* Process */}
      <div className="flex flex-col items-center space-y-4 py-4">
        <FlowchartShape3D type="process" label="sum = a + b" size="lg" interactive={true} />
        <div className="text-center">
          <h4 className="font-bold text-gray-800">Process (Rectangle)</h4>
          <p className="text-sm text-gray-600">Shows calculations, operations, or assignments</p>
        </div>
      </div>

      {/* Decision */}
      <div className="flex flex-col items-center space-y-4 py-4">
        <FlowchartShape3D type="decision" label="x > 10?" size="lg" interactive={true} />
        <div className="text-center">
          <h4 className="font-bold text-gray-800">Decision (Diamond)</h4>
          <p className="text-sm text-gray-600">Represents a yes/no question or condition</p>
        </div>
      </div>

      {/* Input/Output */}
      <div className="flex flex-col items-center space-y-4 py-4">
        <FlowchartShape3D type="input" label="Read number" size="lg" interactive={true} />
        <div className="text-center">
          <h4 className="font-bold text-gray-800">Input/Output (Parallelogram)</h4>
          <p className="text-sm text-gray-600">Represents data entering or leaving the system</p>
        </div>
      </div>

      {/* Example Flow */}
      <div className="mt-12 pt-8 border-t border-gray-300">
        <h4 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Example: Simple Addition
        </h4>
        <div className="flex flex-col items-center space-y-6">
          <FlowchartShape3D type="start" />
          <div className="text-2xl text-gray-400">↓</div>
          <FlowchartShape3D type="input" label="Read a" />
          <div className="text-2xl text-gray-400">↓</div>
          <FlowchartShape3D type="input" label="Read b" />
          <div className="text-2xl text-gray-400">↓</div>
          <FlowchartShape3D type="process" label="sum = a + b" />
          <div className="text-2xl text-gray-400">↓</div>
          <FlowchartShape3D type="output" label="Display sum" />
          <div className="text-2xl text-gray-400">↓</div>
          <FlowchartShape3D type="end" />
        </div>
      </div>
    </div>
  );
};
