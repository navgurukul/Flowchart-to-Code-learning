import React, { useState } from 'react';
import { Exercise, ExecutionResult } from '../types/index';
import { CheckCircle, XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'; // Import ChevronUp and ChevronDown

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
  const [isContentVisible, setIsContentVisible] = useState(true); // Default to true (expanded)

  return (
    <div className={`
      bg-white border-gray-200 flex flex-col h-full transition-all duration-300 ease-in-out
      ${isContentVisible ? 'w-96 border-l' : 'w-0 border-l-0 overflow-hidden'}
    `}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200"> {/* Adjusted padding for consistency */}
        <div className="flex justify-between items-center mb-1 sm:mb-2"> {/* Reduced mb for tighter look */}
          <h3 className="text-md sm:text-lg font-semibold text-gray-900">Input & Output</h3>
          <button
            onClick={() => setIsContentVisible(!isContentVisible)}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={isContentVisible ? "Collapse section" : "Expand section"}
            title={isContentVisible ? "Collapse section" : "Expand section"}
          >
            {isContentVisible ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        {isContentVisible && ( // Conditionally render the description
          <p className="text-xs sm:text-sm text-gray-600">
            Test your code with sample input and compare results.
          </p>
        )}
      </div>

      {/* Collapsible Content Area */}
      <div
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isContentVisible ? 'max-w-[500px] opacity-100' : 'max-w-0 opacity-0'}
        `}
      >
        {/* Input Section */}
        <div className="p-4 sm:p-6 border-b border-gray-200"> {/* Adjusted padding */}
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Sample Input</h4>
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border"> {/* Adjusted padding */}
            <code className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap"> {/* Ensure whitespace is preserved */}
                {exercise.sampleInput || 'No input required'}
              </code>
            </div>
          </div>

          {/* Expected Output Section */}
          <div className="p-4 sm:p-6 border-b border-gray-200"> {/* Adjusted padding */}
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Expected Output</h4>
            <div className="bg-emerald-50 rounded-lg p-3 sm:p-4 border border-emerald-200"> {/* Adjusted padding */}
              <code className="text-xs sm:text-sm text-emerald-800 whitespace-pre-wrap"> {/* Ensure whitespace is preserved */}
                {exercise.expectedOutput}
              </code>
            </div>
          </div>

          {/* Actual Output Section */}
          {/* Note: flex-1 might behave unexpectedly if the parent (transitioning div) is truly height 0. */}
          {/* However, with max-h-0 and overflow-hidden, it should visually collapse. */}
          {/* The parent of this section is the transitioning div, which is a block element. */}
          {/* For flex-1 to work as intended (fill remaining space), its direct parent should be a flex container. */}
          {/* Let's wrap the content sections in another flex-col div if necessary, or ensure the main component div structure supports this. */}
          {/* Current main component is flex-col, this new div is block. So flex-1 here won't expand to fill parent. */}
          {/* It will behave like a normal block, which is fine for collapse. */}
          <div className="p-4 sm:p-6 overflow-y-auto">  {/* Removed flex-1 as its direct parent is not flex, adjusted padding */}
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Output</h4>

            {isRunning ? (
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200"> {/* Adjusted padding */}
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-blue-600 mr-2 animate-spin" />
                  <span className="text-xs sm:text-sm text-blue-800">Running code...</span>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-3 sm:space-y-4"> {/* Adjusted spacing */}
                {/* Output Display */}
                <div className={`rounded-lg p-3 sm:p-4 border ${
                  result.error
                    ? 'bg-red-50 border-red-200'
                    : result.isCorrect
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-orange-50 border-orange-200'
                }`}> {/* Adjusted padding */}
                  {result.error ? (
                    <div className="flex items-start">
                      <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-red-800 mb-1">Error</p>
                        <code className="text-xs text-red-700 whitespace-pre-wrap">{result.error}</code> {/* Ensure whitespace */}
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
                        <p className={`text-xs sm:text-sm font-medium mb-1 ${
                          result.isCorrect ? 'text-emerald-800' : 'text-orange-800'
                        }`}>
                          {result.isCorrect ? 'Correct!' : 'Incorrect Output'}
                        </p>
                        <code className={`text-xs sm:text-sm whitespace-pre-wrap ${
                          result.isCorrect ? 'text-emerald-700' : 'text-orange-700'
                        }`}> {/* Ensure whitespace */}
                          {result.output}
                        </code>
                      </div>
                    </div>
                  )}
                </div>

                {/* Execution Stats */}
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border"> {/* Adjusted padding */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Execution Time</span>
                    <span>{result.executionTime.toFixed(2)}ms</span>
                  </div>
                </div>

                {/* Feedback */}
                {!result.error && (
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200"> {/* Adjusted padding */}
                    <h5 className="text-xs sm:text-sm font-semibold text-blue-900 mb-1 sm:mb-2">Feedback</h5> {/* Adjusted mb */}
                    <p className="text-xs sm:text-sm text-blue-800">
                      {result.isCorrect
                        ? "Excellent! Your solution is correct. The logic matches the flowchart perfectly."
                        : "Your code runs but produces incorrect output. Review the flowchart logic and compare your implementation with the expected algorithm."
                      }
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"> {/* Adjusted padding */}
                <p className="text-xs sm:text-sm text-gray-600 text-center">
                  Click "Run Code" to see your output here
                </p>
              </div>
            )}
          </div>
        {/* End of content that was previously in the <> </> block */}
      </div> {/* End of Collapsible Content Area div */}
    </div>
  );
};