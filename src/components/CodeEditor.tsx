import React, { useState, useEffect } from 'react';
import { Exercise } from '../types/index';
import { Play, RotateCcw, Lightbulb, Code, Edit3 } from 'lucide-react';

interface CodeEditorProps {
  exercise: Exercise;
  generatedCode: string;
  onRunCode: (code: string) => void;
  isRunning: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  exercise, 
  generatedCode,
  onRunCode, 
  isRunning 
}) => {
  const [code, setCode] = useState(generatedCode || '// Build your flowchart to generate code');
  const [showHints, setShowHints] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    if (generatedCode) {
      setCode(generatedCode);
    }
  }, [generatedCode]);

  const handleReset = () => {
    setCode(generatedCode || '// Build your flowchart to generate code');
  };

  const handleRunCode = () => {
    onRunCode(code);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-200">
        <div className="flex items-center flex-shrink-0 mr-2"> {/* Added flex-shrink-0 and mr-2 */}
          <Code className="w-5 h-5 text-gray-600 mr-1 sm:mr-2" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Generated Code</h3>
          {generatedCode && (
            <span className="ml-2 px-2 py-0.5 sm:py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full whitespace-nowrap"> {/* Added whitespace-nowrap */}
              Auto-generated
            </span>
          )}
        </div>
        
        <div className="flex items-center flex-wrap justify-end space-x-1 sm:space-x-2"> {/* Added flex-wrap and justify-end */}
          <button
            onClick={() => setShowHints(!showHints)}
            className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200 transition-colors"
          >
            <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Hints
          </button>

          <button
            onClick={() => setIsEditable(!isEditable)}
            className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
              isEditable 
                ? 'text-blue-700 bg-blue-100 border border-blue-300' 
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {isEditable ? 'Lock' : 'Edit'}
          </button>
          
          <button
            onClick={handleReset}
            disabled={!generatedCode}
            className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Reset
          </button>
          
          <button
            onClick={handleRunCode}
            disabled={isRunning || !code.trim() || code.includes('// Build your flowchart')}
            className="flex items-center px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* Hints Panel */}
      {showHints && (
        <div className="p-4 bg-amber-50 border-b border-amber-200">
          <h4 className="text-sm font-semibold text-amber-900 mb-2">💡 Flowchart Building Tips</h4>
          <ul className="space-y-1">
            {exercise.hints.map((hint, index) => (
              <li key={index} className="text-sm text-amber-800">
                • {hint}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Code Editor */}
      <div className="flex-1 p-4">
        {!generatedCode ? (
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Code Generated Yet</p>
              <p className="text-sm">Build your flowchart and click "Generate Code" to see the JavaScript code</p>
            </div>
          </div>
        ) : (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            readOnly={!isEditable}
            className={`w-full h-full font-mono text-sm rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isEditable 
                ? 'bg-white border border-gray-200' 
                : 'bg-gray-50 border border-gray-200 cursor-default'
            }`}
            placeholder="Generated code will appear here..."
            spellCheck={false}
          />
        )}
      </div>

      {/* Code Statistics */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
          {generatedCode && (
            <span className="text-emerald-600">✓ Auto-generated from flowchart</span>
          )}
        </div>
      </div>
    </div>
  );
};