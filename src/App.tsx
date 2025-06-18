import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { Toaster, toast } from 'react-hot-toast'; // Import toast
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight, Bot, X } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useUserProgress } from './contexts/UserProgressContext'; // Import useUserProgress
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
  const { currentUser, loading: authLoading } = useAuth();
  const {
    progress: userProgress,
    loading: progressLoading,
    error: progressError,
    completeExercise,
    // fetchUserProgress, // Not directly called here, happens via AuthContext effect
  } = useUserProgress();

  // State for UI interaction, not directly part of UserProgressData from context
  const [currentExerciseId, setCurrentExerciseId] = useState<number | null>(null);
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
  // Otherwise, it will be the found exercise or undefined if not found.
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
      if (result.isCorrect) {
        setShowConfetti(true);
      }

      // Update progress if correct and not already completed, using context
      if (result.isCorrect && currentExerciseId !== null && currentUser && userProgress && !userProgress.tasks_completed.includes(currentExerciseId.toString())) {
        const points = currentExercise?.difficulty === 'beginner' ? 50 :
                       currentExercise?.difficulty === 'intermediate' ? 75 : 100;
        try {
          await completeExercise(currentUser.uid, currentExerciseId.toString(), points);
          // Confetti is already handled above. userProgress will update via context.
          // toast.success("Exercise completed and progress saved!"); // Optional: context might show its own toasts
        } catch (err) {
          console.error("Failed to complete exercise via context:", err);
          toast.error("Failed to save exercise completion. Please try again.");
        }
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
  }, [currentUser, userProgress]); // Removed old 'progress' dependency

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

  // Load progress on mount or when auth state changes - This is now handled by UserProgressContext
  // However, we might still want to initialize currentExerciseId based on loaded progress or guide status.
  useEffect(() => {
    if (authLoading) {
      console.log("Auth state loading, waiting to check guide status...");
      return; // Wait for authentication to resolve
    }

    // Check if guide has been seen, only after auth is resolved
    const guideSeen = localStorage.getItem('flowchartGuideSeen');
    if (guideSeen !== 'true' && !currentUser) { // Show guide if not seen and user is not logged in (or first load for anyone)
      console.log("Guide not seen, opening guide.");
      setIsGuideOpen(true);
      setCurrentGuideStep(0);
    } else if (guideSeen !== 'true' && currentUser && userProgress) { // If user is logged in and progress is loaded
        setIsGuideOpen(true);
        setCurrentGuideStep(0);
    }


    // Initialize currentExerciseId. This could be based on userProgress if available,
    // or default to null or the first exercise.
    // UserProgressContext handles fetching, App.tsx just reacts to it for UI.
    if (currentUser && userProgress && !currentExerciseId) {
        // Attempt to set a sensible default current exercise if none is selected
        // This logic might need refinement based on desired UX (e.g., last viewed, first incomplete)
        const lastCompletedNumeric = userProgress.tasks_completed.map(id => parseInt(id,10)).sort((a,b)=>b-a);
        let nextExercise : number | null = null;
        if(lastCompletedNumeric.length > 0){
            const findNext = allExercises.find(ex => ex.id > lastCompletedNumeric[0] && !userProgress.tasks_completed.includes(ex.id.toString()));
            if(findNext) nextExercise = findNext.id;
            else { // if no next, maybe they completed all after last one, or last one is the last exercise.
                 const lastCompletedIsLastExercise = allExercises.some(ex => ex.id === lastCompletedNumeric[0] && ex.id === allExercises[allExercises.length-1].id);
                 if(lastCompletedIsLastExercise || userProgress.tasks_completed.length === allExercises.length) {
                    nextExercise = lastCompletedNumeric[0]; // stay on last completed if all done or it's the true last
                 } else {
                    // Default to first exercise if no better logic applies or they are stuck
                    nextExercise = allExercises.length > 0 ? allExercises[0].id : null;
                 }
            }
        } else if (allExercises.length > 0) {
             nextExercise = allExercises[0].id; // Default to the first exercise if no progress
        }
        setCurrentExerciseId(nextExercise);

    } else if (!currentUser && !currentExerciseId && allExercises.length > 0) {
      // For anonymous users, if no exercise is selected, default to the first one.
      // setCurrentExerciseId(allExercises[0].id); // Or null to force selection
      setCurrentExerciseId(null); // Force selection for anonymous as well
    }

  }, [currentUser, authLoading, userProgress]); // React to changes in these


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

  // Construct headerProgress from userProgress
  const headerProgress: StudentProgress = userProgress ? {
    completedExercises: userProgress.tasks_completed.map(id => parseInt(id, 10)),
    currentExercise: currentExerciseId, // This UI state is still managed by App.tsx
    totalScore: userProgress.points,
    lastAccessedAt: userProgress.last_active, // Already a string from UserProgressData
  } : { // Default structure if userProgress is null (e.g., initial load, logged out)
    completedExercises: [],
    currentExercise: null,
    totalScore: 0,
    lastAccessedAt: new Date().toISOString(),
  };

  // Loading and Error States from Context
  if (authLoading || (currentUser && progressLoading && !userProgress)) {
    return <div className="flex justify-center items-center min-h-screen text-lg">Loading application data...</div>;
  }
  // If user is logged in and there's an error fetching their progress specifically
  if (currentUser && progressError) {
    return <div className="flex flex-col justify-center items-center min-h-screen text-lg text-red-600">
        <p>Error loading your progress: {progressError.message}</p>
        <p className="text-sm text-gray-500 mt-2">Please try refreshing the page. If the issue persists, contact support.</p>
      </div>;
  }
  // If there's an error but no specific user context (e.g. general auth error, though auth context might handle this)
  // This might be redundant if AuthContext handles its own errors comprehensively before this point.
  // For now, focusing on progressError when a user is present.


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative"> {/* Added relative */}
      <Toaster position="top-center" reverseOrder={false} /> {/* Add Toaster here */}
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} />} {/* recycle={false} makes it a one-shot burst */}
      <Header progress={headerProgress} onOpenGuide={handleOpenGuide} />
      
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
              progress={headerProgress} // Use the mapped headerProgress
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