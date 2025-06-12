import React from 'react';
import { Exercise, ExecutionResult } from '../types/index';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface InputOutputProps {
  exercise: Exercise;
  result: ExecutionResult | null;
  isRunning: boolean;
}

export const InputOutput: React.FC<InputOutputProps> = ({ 
  exercise, 
  result, 
  isRunning 
}) => {
  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Input & Output</h3>
        <p className="text-sm text-gray-600">
          Test your code with sample input and compare results
        </p>
      </div>

      {/* Input Section */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Sample Input</h4>
        <div className="bg-gray-50 rounded-lg p-4 border">
          <code className="text-sm text-gray-800">
            {exercise.sampleInput || 'No input required'}
          </code>
        </div>
      </div>

      {/* Expected Output Section */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Expected Output</h4>
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <code className="text-sm text-emerald-800">
            {exercise.expectedOutput}
          </code>
        </div>
      </div>

      {/* Actual Output Section */}
      <div className="flex-1 p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Output</h4>
        
        {isRunning ? (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-blue-600 mr-2 animate-spin" />
              <span className="text-sm text-blue-800">Running code...</span>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {/* Output Display */}
            <div className={`rounded-lg p-4 border ${
              result.error 
                ? 'bg-red-50 border-red-200' 
                : result.isCorrect 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              {result.error ? (
                <div className="flex items-start">
                  <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">Error</p>
                    <code className="text-xs text-red-700">{result.error}</code>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  {result.isCorrect ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-medium mb-1 ${
                      result.isCorrect ? 'text-emerald-800' : 'text-orange-800'
                    }`}>
                      {result.isCorrect ? 'Correct!' : 'Incorrect Output'}
                    </p>
                    <code className={`text-sm ${
                      result.isCorrect ? 'text-emerald-700' : 'text-orange-700'
                    }`}>
                      {result.output}
                    </code>
                  </div>
                </div>
              )}
            </div>

            {/* Execution Stats */}
            <div className="bg-gray-50 rounded-lg p-3 border">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Execution Time</span>
                <span>{result.executionTime.toFixed(2)}ms</span>
              </div>
            </div>

            {/* Feedback */}
            {!result.error && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h5 className="text-sm font-semibold text-blue-900 mb-2">Feedback</h5>
                <p className="text-sm text-blue-800">
                  {result.isCorrect 
                    ? "Excellent! Your solution is correct. The logic matches the flowchart perfectly."
                    : "Your code runs but produces incorrect output. Review the flowchart logic and compare your implementation with the expected algorithm."
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Click "Run Code" to see your output here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};