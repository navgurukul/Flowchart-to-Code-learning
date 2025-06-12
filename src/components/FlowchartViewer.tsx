import React from 'react';
import { Exercise } from '../types/index';
import { ArrowDown, Play, Square } from 'lucide-react';

interface FlowchartViewerProps {
  exercise: Exercise;
}

export const FlowchartViewer: React.FC<FlowchartViewerProps> = ({ exercise }) => {
  const getStepIcon = (step: string) => {
    if (step.includes('START') || step.includes('END')) {
      return <div className="w-3 h-3 bg-emerald-500 rounded-full" />;
    } else if (step.includes('INPUT') || step.includes('OUTPUT')) {
      return <div className="w-3 h-3 bg-blue-500 transform rotate-45" />;
    } else if (step.includes('DECISION') || step.includes('Is ')) {
      return <div className="w-3 h-3 bg-orange-500 transform rotate-45" />;
    } else {
      return <Square className="w-3 h-3 text-purple-500" fill="currentColor" />;
    }
  };

  const getStepColor = (step: string) => {
    if (step.includes('START') || step.includes('END')) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    } else if (step.includes('INPUT') || step.includes('OUTPUT')) {
      return 'border-blue-200 bg-blue-50 text-blue-800';
    } else if (step.includes('DECISION') || step.includes('Is ')) {
      return 'border-orange-200 bg-orange-50 text-orange-800';
    } else {
      return 'border-purple-200 bg-purple-50 text-purple-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Flowchart Logic</h3>
        <p className="text-sm text-gray-600">
          Follow the flowchart steps to understand the algorithm flow
        </p>
      </div>

      <div className="space-y-3">
        {exercise.flowchartSteps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center mr-4">
              {getStepIcon(step)}
              {index < exercise.flowchartSteps.length - 1 && (
                <ArrowDown className="w-4 h-4 text-gray-400 mt-2" />
              )}
            </div>
            
            <div className={`flex-1 p-3 rounded-lg border text-sm ${getStepColor(step)}`}>
              <span className="font-medium">{step}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Flowchart Legend</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2" />
            <span>Start/End</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 transform rotate-45 mr-2" />
            <span>Input/Output</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 transform rotate-45 mr-2" />
            <span>Decision</span>
          </div>
          <div className="flex items-center">
            <Square className="w-3 h-3 text-purple-500 mr-2" fill="currentColor" />
            <span>Process</span>
          </div>
        </div>
      </div>
    </div>
  );
};