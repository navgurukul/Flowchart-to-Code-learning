import React from 'react';

interface FlowchartShape3DProps {
  type: 'start' | 'process' | 'decision' | 'input' | 'output' | 'end';
  label?: string;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const FlowchartShape3D: React.FC<FlowchartShape3DProps> = ({
  type,
  label,
  animate = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-24 h-16',
    md: 'w-32 h-20',
    lg: 'w-40 h-24',
  };

  const animationClass = animate ? 'hover:scale-110 hover:-translate-y-2' : '';

  const renderShape = () => {
    switch (type) {
      case 'start':
      case 'end':
        return (
          <div className={`${sizeClasses[size]} ${animationClass} transition-all duration-300 relative group`}>
            {/* 3D Oval/Ellipse */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full shadow-2xl transform perspective-1000 rotate-x-12">
              {/* Top highlight */}
              <div className="absolute top-2 left-1/4 w-1/2 h-1/4 bg-white/30 rounded-full blur-sm"></div>
              {/* Bottom shadow */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/20 rounded-full blur-md"></div>
            </div>
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm drop-shadow-lg z-10">
                {label || (type === 'start' ? 'START' : 'END')}
              </span>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-green-400/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          </div>
        );

      case 'process':
        return (
          <div className={`${sizeClasses[size]} ${animationClass} transition-all duration-300 relative group`}>
            {/* 3D Rectangle */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-2xl transform perspective-1000">
              {/* Top face (3D effect) */}
              <div className="absolute -top-2 left-2 right-2 h-2 bg-blue-300 rounded-t-lg transform -skew-y-3"></div>
              {/* Right face (3D effect) */}
              <div className="absolute top-0 -right-2 bottom-2 w-2 bg-blue-700 rounded-r-lg transform skew-x-3"></div>
              {/* Top highlight */}
              <div className="absolute top-3 left-1/4 w-1/2 h-1/4 bg-white/30 rounded blur-sm"></div>
            </div>
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-semibold text-xs text-center px-2 drop-shadow-lg z-10">
                {label || 'PROCESS'}
              </span>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-blue-400/50 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          </div>
        );

      case 'decision':
        return (
          <div className={`${sizeClasses[size]} ${animationClass} transition-all duration-300 relative group`}>
            {/* 3D Diamond */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full relative">
                {/* Main diamond */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 transform rotate-45 shadow-2xl rounded-lg">
                  {/* Top highlight */}
                  <div className="absolute top-2 left-1/4 w-1/2 h-1/4 bg-white/40 rounded blur-sm"></div>
                </div>
                {/* 3D depth effect */}
                <div className="absolute inset-0 bg-orange-600 transform rotate-45 translate-x-1 translate-y-1 shadow-xl rounded-lg -z-10"></div>
              </div>
            </div>
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-xs text-center px-2 drop-shadow-lg z-20">
                {label || 'DECISION?'}
              </span>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-yellow-400/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          </div>
        );

      case 'input':
      case 'output':
        return (
          <div className={`${sizeClasses[size]} ${animationClass} transition-all duration-300 relative group`}>
            {/* 3D Parallelogram */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 shadow-2xl transform skew-x-12 rounded-lg">
                {/* Top face */}
                <div className="absolute -top-2 left-2 right-2 h-2 bg-purple-300 rounded-t-lg transform -skew-y-3"></div>
                {/* Top highlight */}
                <div className="absolute top-3 left-1/4 w-1/2 h-1/4 bg-white/30 rounded blur-sm"></div>
              </div>
            </div>
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center transform skew-x-12">
              <span className="text-white font-semibold text-xs text-center px-2 drop-shadow-lg z-10 transform -skew-x-12">
                {label || (type === 'input' ? 'INPUT' : 'OUTPUT')}
              </span>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-purple-400/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 transform skew-x-12"></div>
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
        📊 Flowchart Symbols
      </h3>

      {/* Start/End */}
      <div className="flex flex-col items-center space-y-4">
        <FlowchartShape3D type="start" size="lg" />
        <div className="text-center">
          <h4 className="font-bold text-gray-800">Start/End (Terminal)</h4>
          <p className="text-sm text-gray-600">Marks the beginning or end of a flowchart</p>
        </div>
      </div>

      {/* Process */}
      <div className="flex flex-col items-center space-y-4">
        <FlowchartShape3D type="process" label="sum = a + b" size="lg" />
        <div className="text-center">
          <h4 className="font-bold text-gray-800">Process (Rectangle)</h4>
          <p className="text-sm text-gray-600">Shows calculations, operations, or assignments</p>
        </div>
      </div>

      {/* Decision */}
      <div className="flex flex-col items-center space-y-4">
        <FlowchartShape3D type="decision" label="x > 10?" size="lg" />
        <div className="text-center">
          <h4 className="font-bold text-gray-800">Decision (Diamond)</h4>
          <p className="text-sm text-gray-600">Represents a yes/no question or condition</p>
        </div>
      </div>

      {/* Input/Output */}
      <div className="flex flex-col items-center space-y-4">
        <FlowchartShape3D type="input" label="Read number" size="lg" />
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
