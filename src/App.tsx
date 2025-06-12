import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight } from 'lucide-react'; // Added for icons
import { Header } from './components/Header';
import { ExerciseList } from './components/ExerciseList';
import { FlowchartBuilder } from './components/FlowchartBuilder';
import { CodeEditor } from './components/CodeEditor';
import { InputOutput } from './components/InputOutput';
import { allExercises } from './data/exercises';
import { SafeCodeExecutor } from './utils/codeExecutor';
import { StudentProgress, ExecutionResult, FlowchartData } from './types/index';

function App() {
  const [progress, setProgress] = useState<StudentProgress>({
    completedExercises: [1, 2], // Start with first two completed as examples
    currentExercise: 3,
    totalScore: 150,
    lastAccessedAt: new Date().toISOString()
  });

  const [currentExerciseId, setCurrentExerciseId] = useState(3);
  const [isExerciseListOpen, setIsExerciseListOpen] = useState(true);
  const [isInputOutputOpen, setIsInputOutputOpen] = useState(true);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [currentFlowchart, setCurrentFlowchart] = useState<FlowchartData>({ nodes: [], edges: [] });

  const currentExercise = allExercises.find(ex => ex.id === currentExerciseId) || allExercises[0];

  const handleSelectExercise = (exerciseId: number) => {
    setCurrentExerciseId(exerciseId);
    setExecutionResult(null);
    setGeneratedCode('');
    setCurrentFlowchart({ nodes: [], edges: [] });
    setProgress(prev => ({
      ...prev,
      currentExercise: exerciseId,
      lastAccessedAt: new Date().toISOString()
    }));
  };

  const handleFlowchartChange = (flowchart: FlowchartData) => {
    setCurrentFlowchart(flowchart);
    
    // Generate code from flowchart
    const code = generateCodeFromFlowchart(flowchart);
    setGeneratedCode(code);
  };

  const generateCodeFromFlowchart = (flowchart: FlowchartData): string => {
    if (flowchart.nodes.length === 0) return '';

    // Validate flowchart structure
    const errors = SafeCodeExecutor.validateFlowchartLogic(flowchart.nodes, flowchart.edges);
    if (errors.length > 0) {
      return `// Flowchart validation errors:\n// ${errors.join('\n// ')}\n\nfunction solution() {\n  // Fix the flowchart structure first\n  return "error";\n}`;
    }

    // Simple code generation based on flowchart structure
    let code = 'function solution(';
    
    // Find input nodes to determine parameters
    const inputNodes = flowchart.nodes.filter(node => node.type === 'input');
    if (inputNodes.length > 0) {
      const params = inputNodes.map((node, index) => {
        const paramName = node.data.label.toLowerCase().replace(/[^a-z0-9]/g, '') || `input${index + 1}`;
        return paramName;
      }).join(', ');
      code += params;
    }
    code += ') {\n';

    // Add variable declarations for inputs
    inputNodes.forEach((node, index) => {
      const varName = node.data.label.toLowerCase().replace(/[^a-z0-9]/g, '') || `input${index + 1}`;
      code += `  // Input: ${node.data.label}\n`;
    });

    // Process nodes in a simple sequential manner
    const processNodes = flowchart.nodes.filter(node => node.type === 'process');
    processNodes.forEach(node => {
      if (node.data.value && node.data.value.trim()) {
        code += `  ${node.data.value.endsWith(';') ? node.data.value : node.data.value + ';'}\n`;
      } else {
        code += `  // Process: ${node.data.label}\n`;
      }
    });

    // Handle decision nodes
    const decisionNodes = flowchart.nodes.filter(node => node.type === 'decision');
    decisionNodes.forEach(node => {
      if (node.data.condition && node.data.condition.trim()) {
        code += `  if (${node.data.condition}) {\n`;
        code += `    // Yes path\n`;
        code += `  } else {\n`;
        code += `    // No path\n`;
        code += `  }\n`;
      }
    });

    // Handle loop nodes
    const loopNodes = flowchart.nodes.filter(node => node.type === 'loop');
    loopNodes.forEach(node => {
      code += `  // Loop: ${node.data.label}\n`;
      if (node.data.condition) {
        code += `  while (${node.data.condition}) {\n`;
        code += `    // Loop body\n`;
        code += `  }\n`;
      }
    });

    // Find output nodes for return statement
    const outputNodes = flowchart.nodes.filter(node => node.type === 'output');
    if (outputNodes.length > 0) {
      const outputValue = outputNodes[0].data.value || outputNodes[0].data.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (outputValue && !outputValue.includes('display') && !outputValue.includes('print')) {
        code += `  return ${outputValue};\n`;
      } else {
        code += `  return "${outputNodes[0].data.label}";\n`;
      }
    } else {
      code += `  return "result";\n`;
    }

    code += '}';
    return code;
  };

  const handleRunCode = async (code: string) => {
    setIsRunning(true);
    setExecutionResult(null);

    try {
      const result = await SafeCodeExecutor.executeCode(
        code,
        currentExercise.sampleInput,
        currentExercise.expectedOutput
      );

      setExecutionResult(result);

      // Update progress if correct and not already completed
      if (result.isCorrect && !progress.completedExercises.includes(currentExerciseId)) {
        const points = currentExercise.difficulty === 'beginner' ? 50 : 
                     currentExercise.difficulty === 'intermediate' ? 75 : 100;
        
        setProgress(prev => ({
          ...prev,
          completedExercises: [...prev.completedExercises, currentExerciseId],
          totalScore: prev.totalScore + points,
          lastAccessedAt: new Date().toISOString()
        }));
      }
    } catch (error) {
      setExecutionResult({
        output: '',
        error: 'Failed to execute code',
        isCorrect: false,
        executionTime: 0
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('studentProgress', JSON.stringify(progress));
  }, [progress]);

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('studentProgress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setProgress(parsed);
        setCurrentExerciseId(parsed.currentExercise || 1);
      } catch (error) {
        console.error('Failed to load saved progress:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header progress={progress} />
      
      <div className="flex-1 flex overflow-hidden"> {/* Added overflow-hidden for safety */}
        {/* Left Panel Toggle & Exercise List */}
        <div className="flex"> {/* Container for toggle and panel */}
          <button
            onClick={() => setIsExerciseListOpen(!isExerciseListOpen)}
            className="p-2 bg-gray-200 hover:bg-gray-300 h-full flex items-center justify-center"
            title={isExerciseListOpen ? "Collapse Exercise List" : "Expand Exercise List"}
          >
            {isExerciseListOpen ? <ChevronLeft size={20} /> : <PanelLeft size={20} />}
          </button>
          {isExerciseListOpen && (
            <ExerciseList
              exercises={allExercises}
              progress={progress}
              currentExercise={currentExerciseId}
              onSelectExercise={handleSelectExercise}
            />
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto"> {/* Added overflow-y-auto */}
          {/* Exercise Title */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full mr-3">
                    Exercise {currentExercise.id}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    currentExercise.difficulty === 'beginner' 
                      ? 'text-green-600 bg-green-100' 
                      : currentExercise.difficulty === 'intermediate'
                      ? 'text-yellow-600 bg-yellow-100'
                      : 'text-red-600 bg-red-100'
                  }`}>
                    {currentExercise.difficulty}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentExercise.title}
                </h2>
                <p className="text-gray-600 mb-3">
                  {currentExercise.description}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Problem Statement</h3>
                  <p className="text-sm text-blue-800">{currentExercise.problemStatement}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Category</div>
                <div className="text-sm font-medium text-gray-900">
                  {currentExercise.category}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          {/* Ensure this grid and its children can handle varying widths */}
          <div className={`grid ${isExerciseListOpen || isInputOutputOpen ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-6 h-[600px]`}>
            <FlowchartBuilder
              exercise={currentExercise}
              onGenerateCode={handleFlowchartChange}
              onRunCode={handleRunCode}
              isRunning={isRunning}
            />
            
            <CodeEditor
              exercise={currentExercise}
              generatedCode={generatedCode}
              onRunCode={handleRunCode}
              isRunning={isRunning}
            />
          </div>
        </div>

        {/* Right Panel Toggle & Input/Output Panel */}
        <div className="flex"> {/* Container for toggle and panel */}
          {isInputOutputOpen && (
            <InputOutput
              exercise={currentExercise}
              result={executionResult}
              isRunning={isRunning}
            />
          )}
          <button
            onClick={() => setIsInputOutputOpen(!isInputOutputOpen)}
            className="p-2 bg-gray-200 hover:bg-gray-300 h-full flex items-center justify-center"
            title={isInputOutputOpen ? "Collapse Input/Output Panel" : "Expand Input/Output Panel"}
          >
            {isInputOutputOpen ? <ChevronRight size={20} /> : <PanelRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;