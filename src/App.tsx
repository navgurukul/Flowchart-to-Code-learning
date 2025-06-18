import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { Toaster } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight, Bot, X } from 'lucide-react';
import { useAuth } from './contexts/AuthContext'; // Import useAuth
import { Header } from './components/Header';
import { ExerciseList } from './components/ExerciseList';
import { FlowchartBuilder } from './components/FlowchartBuilder';
import { CodeEditor } from './components/CodeEditor';
import { InputOutput } from './components/InputOutput';
import { ChatWindow } from './components/ChatWindow';
import GuideModal from './components/GuideModal'; // Import GuideModal
import { allExercises } from './data/exercises';
import { guideSteps } from './data/guideSteps';
import { SafeCodeExecutor } from './utils/codeExecutor';
import { StudentProgress, ExecutionResult, FlowchartData } from './types/index';

function App() {
  const { currentUser, loading: authLoading } = useAuth(); // Get auth state

  // Initial progress state (will be overwritten by loaded data)
  const defaultInitialProgress: StudentProgress = {
    completedExercises: [],
    currentExercise: null, // Changed: No exercise selected initially
    totalScore: 0,
    lastAccessedAt: new Date().toISOString()
  };

  const [progress, setProgress] = useState<StudentProgress>(defaultInitialProgress);
  const [currentExerciseId, setCurrentExerciseId] = useState<number | null>(null); // Changed: No exercise selected initially
  const [isExerciseListOpen, setIsExerciseListOpen] = useState(true);
  const [isInputOutputOpen, setIsInputOutputOpen] = useState(true);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [currentFlowchart, setCurrentFlowchart] = useState<FlowchartData>({ nodes: [], edges: [] });
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false); // Changed: Default to false
  const [isChatOpen, setIsChatOpen] = useState(false); // Default to closed
  const [aiFlowchartToLoad, setAiFlowchartToLoad] = useState<FlowchartData | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Guide State
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [currentGuideStep, setCurrentGuideStep] = useState(0);
  // No need for hasSeenGuide state, directly use localStorage and setIsGuideOpen

  // If currentExerciseId is null, currentExercise will be null.
  // Otherwise, it will be the found exercise or undefined if not found (though ExerciseList should prevent invalid IDs).
  const currentExercise = currentExerciseId !== null
    ? allExercises.find(ex => ex.id === currentExerciseId)
    : null;

  const handleSelectExercise = (exerciseId: number) => {
    setCurrentExerciseId(exerciseId);
    
    setExecutionResult(null); // Reset execution result when changing exercises
    setGeneratedCode(''); // Clear generated code
    setCurrentFlowchart({ nodes: [], edges: [] }); // Clear flowchart
    setIsCodeEditorOpen(false); // Reset code editor visibility to closed
    // Note: We no longer set progress.currentExercise here, as this is UI state.
    // The backend and UserProgressContext handle the persistent 'last_active' etc.

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

      if (result.isCorrect) {
        setShowConfetti(true);
      }

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

  // Save progress
  useEffect(() => {
    if (currentUser) {
      console.log("Saving to backend would happen here for user:", currentUser.uid, "Progress:", progress);
      // For now, still save to localStorage for logged-in users
      localStorage.setItem(`studentProgress_${currentUser.uid}`, JSON.stringify(progress));
    } else {
      localStorage.setItem('studentProgress_anonymous', JSON.stringify(progress));
    }
  }, [progress, currentUser]);

  const handleNewFlowchartFromAI = (newFlowchartData: FlowchartData) => {
    console.log("App.tsx: Received new flowchart from AI to load:", newFlowchartData);
    // This will be the data that FlowchartBuilder should render.
    // We'll need a way for FlowchartBuilder to pick this up.
    // For now, just setting this state.
    setAiFlowchartToLoad(newFlowchartData);
    // We also want this to become the "current" flowchart that code is generated from etc.
    // So, also call the existing handler that FlowchartBuilder uses.
    handleFlowchartChange(newFlowchartData); // This will update generatedCode and what FlowchartBuilder shows.
  };

  // Guide Modal Handlers
  const handleGuideNext = () => {
    if (currentGuideStep < guideSteps.length - 1) {
      setCurrentGuideStep(prevStep => prevStep + 1);
    }
  };

  const handleGuidePrev = () => {
    if (currentGuideStep > 0) {
      setCurrentGuideStep(prevStep => prevStep - 1);
    }
  };

  const handleGuideClose = () => {
    setIsGuideOpen(false);
    localStorage.setItem('flowchartGuideSeen', 'true');
    setCurrentGuideStep(0); // Reset for next time
  };

  const handleOpenGuide = () => { // New handler to open guide
    setCurrentGuideStep(0);
    setIsGuideOpen(true);
  };

  // Load progress on mount or when auth state changes
  useEffect(() => {
    if (authLoading) {
      console.log("Auth state loading, waiting to load progress and check guide status...");
      return; // Wait for authentication to resolve
    }

    // Check if guide has been seen, only after auth is resolved
    const guideSeen = localStorage.getItem('flowchartGuideSeen');
    if (guideSeen !== 'true') {
      console.log("Guide not seen, opening guide.");
      setIsGuideOpen(true);
      setCurrentGuideStep(0);
      // Don't proceed to loadData immediately if guide is opening,
      // or ensure guide doesn't interfere with loading experience.
      // For now, guide opens, and data loads in parallel if needed or after guide closes.
    }

    const loadData = async () => {
      if (currentUser) {
        console.log("User logged in, attempting to fetch progress for UID:", currentUser.uid);
        try {
          // TODO: Adjust the fetch URL if your backend is on a different port/domain
          const response = await fetch(`/api/users/${currentUser.uid}/details`);
          if (!response.ok) {
            throw new Error(`Failed to fetch user details: ${response.status}`);
          }
          const backendData = await response.json(); // This is UserDetails model
          console.log("Fetched backend data:", backendData);

          // Map UserDetails to StudentProgress
          const completedExercisesNumbers = backendData.tasks_completed.map(Number);
          const latestCompleted = completedExercisesNumbers.length > 0 ? Math.max(0, ...completedExercisesNumbers) : 0;

          let nextExerciseId: number | null = null;
          const firstIncomplete = allExercises.find(ex => ex.id > latestCompleted && !completedExercisesNumbers.includes(ex.id));
          if (firstIncomplete) {
            nextExerciseId = firstIncomplete.id;
          } else if (allExercises.length > 0) {
            // If all are complete or no specific next, default to first or last+1 (capped)
            nextExerciseId = completedExercisesNumbers.includes(allExercises[allExercises.length -1].id)
                              ? allExercises[allExercises.length -1].id // Stay on last if all complete
                              : (latestCompleted < allExercises.length ? latestCompleted + 1 : allExercises[0].id);
          }
          // Ensure nextExerciseId is not out of bounds if calculated as latestCompleted + 1
          if (nextExerciseId && nextExerciseId > allExercises[allExercises.length -1].id && allExercises.length > 0) {
             nextExerciseId = allExercises[allExercises.length -1].id;
          }


          const newProgress: StudentProgress = {
            completedExercises: completedExercisesNumbers,
            currentExercise: nextExerciseId, // Can be null if no exercises or logic determines so
            totalScore: backendData.points,
            lastAccessedAt: new Date(backendData.last_active).toISOString(),
          };
          setProgress(newProgress);
          setCurrentExerciseId(newProgress.currentExercise); // This can be null
          console.log("Progress updated from backend:", newProgress);

        } catch (error) {
          console.error('Failed to fetch progress from backend, using default:', error);
          const userSpecificStorageKey = `studentProgress_${currentUser.uid}`;
          const savedProgressLocal = localStorage.getItem(userSpecificStorageKey);
          if (savedProgressLocal) {
            try {
              const parsed = JSON.parse(savedProgressLocal);
              setProgress(parsed);
              // Ensure currentExercise from local storage is valid, default to null if not.
              setCurrentExerciseId(parsed.currentExercise === 0 ? null : (parsed.currentExercise || null));
              console.log("Loaded progress from user-specific localStorage:", parsed);
            } catch (parseError) {
              console.error('Failed to parse user-specific saved progress:', parseError);
              setProgress(defaultInitialProgress);
              setCurrentExerciseId(defaultInitialProgress.currentExercise); // null
            }
          } else {
            setProgress(defaultInitialProgress);
            setCurrentExerciseId(defaultInitialProgress.currentExercise); // null
            console.log("No user-specific local progress, set to default (no exercise selected).");
          }
        }
      } else {
        console.log("User not logged in, loading progress from anonymous localStorage.");
        const savedProgress = localStorage.getItem('studentProgress_anonymous');
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            setProgress(parsed);
             // Ensure currentExercise from local storage is valid, default to null if not.
            setCurrentExerciseId(parsed.currentExercise === 0 ? null : (parsed.currentExercise || null));
            console.log("Loaded progress from anonymous localStorage:", parsed);
          } catch (error) {
            console.error('Failed to load anonymous saved progress:', error);
            setProgress(defaultInitialProgress);
            setCurrentExerciseId(defaultInitialProgress.currentExercise); // null
          }
        } else {
          console.log("No anonymous local progress, set to default (no exercise selected).");
          setProgress(defaultInitialProgress);
          setCurrentExerciseId(defaultInitialProgress.currentExercise); // null
        }
      }
    };

    loadData();
  }, [currentUser, authLoading]); // Re-run when auth state is confirmed or user changes

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    // Call handleResize once initially to set size correctly
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000); // Confetti duration: 5 seconds (e.g., 5000ms)
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative"> {/* Added relative */}
      <Toaster position="top-center" reverseOrder={false} /> {/* Add Toaster here */}
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} />} {/* recycle={false} makes it a one-shot burst */}
      <Header progress={progress} onOpenGuide={handleOpenGuide} />
      
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
        {currentExercise ? (
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

            {/* Toggle for Code Editor */}
            <button
              onClick={() => setIsCodeEditorOpen(!isCodeEditorOpen)}
              className="mb-2 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              {isCodeEditorOpen ? 'Hide Code Editor' : 'Show Code Editor'}
            </button>

            {/* Main Content Grid */}
            <div className={`grid grid-cols-1 ${isCodeEditorOpen ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6 h-[750px]`}>
              <FlowchartBuilder
                exercise={currentExercise}
                onGenerateCode={handleFlowchartChange}
                onRunCode={handleRunCode}
                isRunning={isRunning}
                newFlowchartToLoad={aiFlowchartToLoad}
              />

              {isCodeEditorOpen && (
                <CodeEditor
                  exercise={currentExercise}
                  generatedCode={generatedCode}
                  onRunCode={handleRunCode}
                  isRunning={isRunning}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 flex items-center justify-center">
            <p className="text-xl text-gray-500">Please select an exercise to begin.</p>
          </div>
        )}

        {/* Right Panel Toggle & Input/Output Panel */}
        {currentExercise && ( // Only show if an exercise is selected
          <div className="flex h-full sticky top-0"> {/* Apply sticky classes here */}
            {isInputOutputOpen && (
              <InputOutput
                exercise={currentExercise} // currentExercise will not be null here
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
        )}
      </div>
      {/* Chat Window (conditionally rendered) */}
      {isChatOpen && <ChatWindow
                      onClose={() => setIsChatOpen(false)}
                      onFlowchartGenerated={handleNewFlowchartFromAI} // New prop
                   />}

      {/* AI Chat Toggle Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-transform duration-150 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title={isChatOpen ? "Close AI Chat" : "Open AI Chat"}
        aria-label={isChatOpen ? "Close AI Chat" : "Open AI Chat"}
      >
        {isChatOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      <GuideModal
        isOpen={isGuideOpen}
        title={guideSteps[currentGuideStep]?.title || "Guide"}
        content={guideSteps[currentGuideStep]?.content || "Loading content..."}
        // imageSrc={guideSteps[currentGuideStep]?.actualImageSrcUrl} // Future: use actual image URLs
        imagePlaceholderText={guideSteps[currentGuideStep]?.imagePlaceholder} // Pass placeholder text
        currentStep={currentGuideStep}
        totalSteps={guideSteps.length}
        onNext={handleGuideNext}
        onPrev={handleGuidePrev}
        onClose={handleGuideClose}
      />
    </div>
  );
}

export default App;