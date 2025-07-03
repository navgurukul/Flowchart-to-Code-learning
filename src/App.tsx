import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { Toaster } from 'react-hot-toast';
import { getDatabase, ref, get, set, update, serverTimestamp } from 'firebase/database'; // Added update and serverTimestamp
import { app } from "./firebaseConfig";
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight, Bot, X, PlaySquare, StepForward, Square, Users } from 'lucide-react'; // Added Users icon
import { useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { OnlineUsersPanel } from './components/OnlineUsersPanel'; // Import the new panel
import { GamifiedExerciseMap } from './components/GamifiedExerciseMap';
import { FlowchartBuilder } from './components/FlowchartBuilder';
import { CodeEditor } from './components/CodeEditor';
import { InputOutput } from './components/InputOutput';
import { ChatWindow } from './components/ChatWindow';
import GuideModal from './components/GuideModal';
import { allExercises } from './data/exercises';
import { guideSteps } from './data/guideSteps';
import { SafeCodeExecutor } from './utils/codeExecutor';
import { StudentProgress, ExecutionResult, FlowchartData } from './types/index';
import { DryRunState, DryRunVariableMap } from './types/dryRun';
import { FlowchartSimulator } from './engine/dryRun/FlowchartSimulator';
import { DryRunInputModal } from './components/dryRun/DryRunInputModal';

function App() {
  const { currentUser, loading: authLoading } = useAuth();

  // --- Standard App State ---
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
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(true); // New state for CodeEditor visibility
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

  // --- Dry Run State ---
  const [isDryRunMode, setIsDryRunMode] = useState<boolean>(false);
  const [dryRunSimulator, setDryRunSimulator] = useState<FlowchartSimulator | null>(null);
  const [currentDryRunState, setCurrentDryRunState] = useState<DryRunState | null>(null);
  const [showDryRunInputModal, setShowDryRunInputModal] = useState<boolean>(false);
  // TODO: Add state for initialInputs for dry run if needed for modal

  // --- Derived State ---
  const currentExercise = currentExerciseId !== null
    ? allExercises.find(ex => ex.id === currentExerciseId)
    : null;

  // --- Online Users Panel State ---
  const [isOnlineUsersPanelOpen, setIsOnlineUsersPanelOpen] = useState(false);

  // --- Event Handlers ---
  const handleSelectExercise = (exerciseId: number) => {
    if (isDryRunMode) { // Prevent changing exercise during dry run
      // Optionally, show a toast or alert
      console.warn("Cannot change exercise while Dry Run mode is active.");
      return;
    }
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

    // Ensure not in dry run mode when running actual code
    if (isDryRunMode) {
      console.error("Cannot run code while Dry Run mode is active.");
      setIsRunning(false);
      // Optionally, show a toast message to the user.
      // toast.error("Please end the dry run before running the code.");
      return;
    }

    try {
      const result = await SafeCodeExecutor.executeCode(
        code,
        currentExercise!.sampleInput, // currentExercise should exist if we are running code for it
        currentExercise!.expectedOutput
      );

      setExecutionResult(result);

      if (result.isCorrect) {
        setShowConfetti(true);
      }

      // Update progress if correct and not already completed
      if (result.isCorrect && currentExerciseId !== null && !progress.completedExercises.includes(currentExerciseId)) {
        const points = currentExercise!.difficulty === 'beginner' ? 50 :
                       currentExercise!.difficulty === 'intermediate' ? 75 : 100;
        
        setProgress(prev => ({
          ...prev,
          completedExercises: [...prev.completedExercises, currentExerciseId!],
          totalScore: prev.totalScore + points,
          lastAccessedAt: new Date().toISOString()
        }));
      }
    } catch (error) {
      setExecutionResult({
        output: '',
        error: 'Failed to execute code: ' + (error instanceof Error ? error.message : String(error)),
        isCorrect: false,
        executionTime: 0
      });
    } finally {
      setIsRunning(false);
    }
  };

  // --- Dry Run Handlers ---
  const handleStartDryRunSetup = () => {
    if (!currentExercise || currentFlowchart.nodes.length === 0) {
      // toast.error("Please select an exercise and build a flowchart to start a dry run.");
      console.error("Cannot start dry run: No current exercise or flowchart is empty.");
      return;
    }
    console.log("Setting up dry run...");
    // In a real scenario, here you'd collect initial inputs, e.g. by opening a modal.
    // For now, let's assume some dummy inputs or proceed to initialize without specific inputs
    // if the flowchart doesn't have input nodes or they are handled differently.
    // setShowDryRunInputModal(true); // This would be the typical next step.

    // setShowDryRunInputModal(true); // This would be the typical next step.

    // For now, let's proceed with dummy initial inputs for testing the simulator initialization
    // const dummyInitialInputs: DryRunVariableMap = {};
    // // Example: find input nodes in currentFlowchart and add them to dummyInitialInputs
    // currentFlowchart.nodes.filter(node => node.type === 'input').forEach((node, index) => {
    //     // Use node.data.label or a sanitized version as variable name
    //     const varName = node.data.label?.trim().replace(/\s+/g, '_') || `input${index + 1}`;
    //     // Prompt or use a default value; for now, using a placeholder
    //     dummyInitialInputs[varName] = `test_val_${index + 1}`; // Or prompt user
    // });
    // console.log("Dummy initial inputs for dry run:", dummyInitialInputs);
    // handleInitializeDryRun(dummyInitialInputs);
    setShowDryRunInputModal(true); // Open the modal to collect inputs
  };

  const handleInitializeDryRun = (initialInputs: DryRunVariableMap) => {
    if (!currentFlowchart || currentFlowchart.nodes.length === 0) {
      console.error("Cannot initialize dry run: Flowchart data is missing or empty.");
      // toast.error("Flowchart is empty. Cannot start dry run.");
      setShowDryRunInputModal(false);
      return;
    }
    console.log("Initializing dry run with inputs:", initialInputs);
    const simulator = new FlowchartSimulator(currentFlowchart, initialInputs);
    setDryRunSimulator(simulator);
    setCurrentDryRunState(simulator.getState());
    setIsDryRunMode(true);
    setShowDryRunInputModal(false);
    // toast.success("Dry Run mode started!");
  };

  const handleDryRunNextStep = () => {
    if (dryRunSimulator) {
      console.log("Executing next dry run step...");
      const newState = dryRunSimulator.nextStep();
      setCurrentDryRunState(newState);
      if (newState.isComplete) {
        // toast.info("Dry run complete!");
        console.log("Dry run complete.");
      }
    } else {
      console.error("Dry run simulator not initialized.");
    }
  };

  const handleEndDryRun = () => {
    console.log("Ending dry run mode...");
    setIsDryRunMode(false);
    setDryRunSimulator(null);
    setCurrentDryRunState(null);
    // toast.info("Dry Run mode ended.");
  };


  // --- Standard Effects ---
  // Save progress
  useEffect(() => {
    if (currentUser) {
      // Save to Firebase Realtime Database
      try {
        const db = getDatabase(app);
        const userProgressRef = ref(db, `userProgress/${currentUser.uid}`);
        set(userProgressRef, progress)
          .then(() => {
            console.log("Progress saved to Firebase Realtime Database for user:", currentUser.uid);
          })
          .catch((error) => {
            console.error("Error saving progress to Firebase Realtime Database:", error);
          });
      } catch (error) {
        // This catch is for synchronous errors in the setup, though unlikely for db/ref calls
        console.error("Synchronous error setting up Firebase save:", error);
      }

      // Also save to localStorage as a backup or for quicker local access
      console.log("Saving progress to localStorage for user:", currentUser.uid);
      localStorage.setItem(`studentProgress_${currentUser.uid}`, JSON.stringify(progress));
    } else {
      // Save to anonymous localStorage if no user is logged in
      console.log("Saving progress to anonymous localStorage.");
      localStorage.setItem('studentProgress_anonymous', JSON.stringify(progress));
    }
  }, [progress, currentUser]);

  // Effect to update user's current flowchart ID in Firebase presence
  useEffect(() => {
    if (currentUser) {
      const db = getDatabase(app);
      const userPresenceRef = ref(db, `onlineUsers/${currentUser.uid}`);
      const newFlowchartId = currentExerciseId !== null ? `exercise-${currentExerciseId}` : null;

      update(userPresenceRef, {
        currentFlowchartId: newFlowchartId,
        currentNodeId: null, // Reset current node when flowchart changes
        lastSeen: serverTimestamp() // Also update lastSeen
      }).catch(error => {
        console.error("Error updating current flowchart ID in presence:", error);
      });
    }
  }, [currentExerciseId, currentUser]);

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

        // 1. Try loading from Firebase Realtime Database first
        try {
          const db = getDatabase(app);
          const userProgressRef = ref(db, `userProgress/${currentUser.uid}`);
          const snapshot = await get(userProgressRef);

          if (snapshot.exists()) {
            let firebaseProgress = snapshot.val() as Partial<StudentProgress>; // Use Partial to acknowledge fields might be missing

            // Ensure essential fields are present, providing defaults if necessary.
            if (!firebaseProgress) { // Should not happen if snapshot.exists() is true, but good check
              firebaseProgress = {};
            }

            const validatedProgress: StudentProgress = {
              completedExercises: firebaseProgress.completedExercises || [], // Default to empty array if missing
              currentExercise: firebaseProgress.currentExercise === 0 ? null : (firebaseProgress.currentExercise || null),
              totalScore: typeof firebaseProgress.totalScore === 'number' ? firebaseProgress.totalScore : 0, // Default to 0 if missing/invalid
              lastAccessedAt: firebaseProgress.lastAccessedAt || new Date().toISOString(), // Default to now if missing
            };

            // Now, check if the original data (or defaults) are usable.
            // The main concern from the log was `completedExercises` being undefined.
            // The `totalScore` check was `typeof firebaseProgress.totalScore === 'number'`.
            // With defaults, `validatedProgress` should always be in a usable state.

            setProgress(validatedProgress);
            setCurrentExerciseId(validatedProgress.currentExercise);
            console.log("Progress loaded and validated from Firebase Realtime Database:", validatedProgress);
            return; // Successfully loaded (and potentially corrected) from Firebase

          } else {
            console.log("No progress found in Firebase Realtime Database for this user.");
            // Fall through to API/localStorage
          }
        } catch (error) {
          console.error("Error loading progress from Firebase Realtime Database:", error);
          // Fall through to API/localStorage on error
        }

        // 2. If Firebase load failed or no data, try API
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

  // Debug log for current exercise state at render time
  console.log(
    `App.tsx render: currentExerciseId = ${currentExerciseId}, currentExercise?.id = ${currentExercise?.id}, progress.currentExercise = ${progress.currentExercise}, isDryRunMode = ${isDryRunMode}`
  );
  // Further log dry run state if active
  if (isDryRunMode && currentDryRunState) {
    console.log("App.tsx Dry Run State:", currentDryRunState);
  }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <Toaster position="top-center" reverseOrder={false} />
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} />}
      <Header progress={progress} onOpenGuide={handleOpenGuide} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Exercise List */}
        <div className="flex"> {/* Container for button and panel */}
          <button
            onClick={() => setIsExerciseListOpen(!isExerciseListOpen)}
            className="p-2 bg-gray-200 hover:bg-gray-300 h-full flex items-center justify-center z-10"
            title={isExerciseListOpen ? "Collapse Exercise List" : "Expand Exercise List"}
          >
            {isExerciseListOpen ? <ChevronLeft size={20} /> : <PanelLeft size={20} />}
          </button>
          {isExerciseListOpen && (
            <GamifiedExerciseMap
              exercises={allExercises}
              progress={progress}
              currentExerciseId={currentExerciseId}
              onSelectExercise={handleSelectExercise}
              isDryRunMode={isDryRunMode} // Pass dry run mode to disable interactions
            />
          )}
        </div>

        {/* Main Content Area */}
        {currentExercise ? (
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Exercise Title & Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div> {/* Left side: Title, Description, Problem */}
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full mr-3">
                      Exercise {currentExercise.id}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      currentExercise.difficulty === 'beginner' ? 'text-green-600 bg-green-100' :
                      currentExercise.difficulty === 'intermediate' ? 'text-yellow-600 bg-yellow-100' :
                      'text-red-600 bg-red-100'
                    }`}>
                      {currentExercise.difficulty}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentExercise.title}</h2>
                  <p className="text-gray-600 mb-3">{currentExercise.description}</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Problem Statement</h3>
                    <p className="text-sm text-blue-800">{currentExercise.problemStatement}</p>
                  </div>
                </div>
                <div className="text-right"> {/* Right side: Category, Dry Run Controls */}
                  <div className="text-sm text-gray-500 mb-1">Category</div>
                  <div className="text-sm font-medium text-gray-900 mb-4">{currentExercise.category}</div>

                  {/* Dry Run Controls */}
                  {!isDryRunMode ? (
                    <button
                      onClick={handleStartDryRunSetup}
                      className="mt-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center"
                      title="Start Dry Run Simulation"
                    >
                      <PlaySquare size={18} className="mr-2" /> Dry Run
                    </button>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={handleDryRunNextStep}
                        disabled={currentDryRunState?.isComplete || !currentDryRunState}
                        className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md flex items-center disabled:opacity-50"
                        title="Execute Next Step"
                      >
                        <StepForward size={18} className="mr-2" /> Next Step
                      </button>
                      <button
                        onClick={handleEndDryRun}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center"
                        title="End Dry Run Simulation"
                      >
                        <Square size={18} className="mr-2" /> End Dry Run
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Toggle for Code Editor */}

            {/* Code Editor Toggle & Main Content Grid */}
            <div>
              <button
                onClick={() => setIsCodeEditorOpen(!isCodeEditorOpen)}
                className="mb-2 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                {isCodeEditorOpen ? 'Hide Code Editor' : 'Show Code Editor'}
              </button>
            </div>

            <div className={`grid grid-cols-1 ${isCodeEditorOpen ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6 h-[750px]`}>
              <FlowchartBuilder
                exercise={currentExercise}
                onGenerateCode={handleFlowchartChange}
                onRunCode={handleRunCode} // This is for actual code execution, not dry run steps
                isRunning={isRunning && !isDryRunMode} // Actual run is only when not in dry run
                newFlowchartToLoad={aiFlowchartToLoad}
                highlightedNodeId={isDryRunMode ? currentDryRunState?.currentProcessedNodeId : null} // Highlight current dry run node
              />
              {isCodeEditorOpen && (
                <CodeEditor
                  exercise={currentExercise}
                  generatedCode={generatedCode}
                  onRunCode={handleRunCode}
                  isRunning={isRunning && !isDryRunMode}
                  isReadOnly={isDryRunMode} // Make code editor read-only during dry run
                />
              )}
            </div>

            {/* Dry Run Information Panels - Shown when isDryRunMode is true */}
            {isDryRunMode && currentDryRunState && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dry Run Log Panel Placeholder */}
                <div className="bg-white p-4 rounded-lg shadow border">
                  <h3 className="text-lg font-semibold mb-2">Dry Run Log</h3>
                  <pre className="text-xs bg-gray-50 p-2 rounded max-h-60 overflow-y-auto">
                    {currentDryRunState.log.length > 0 ?
                      currentDryRunState.log.map((entry, index) => (
                        <div key={index} className={`text-${entry.type === 'error' ? 'red' : entry.type === 'info' ? 'blue' : 'black'}-600`}>
                          [{entry.timestamp.split('T')[1].slice(0,8)}] {entry.nodeId && `[Node: ${entry.nodeId}] `}{entry.message}
                          {entry.data?.variableName && ` (${entry.data.variableName}: ${JSON.stringify(entry.data.newValue)})`}
                        </div>
                      )) : "Log is empty."}
                  </pre>
                </div>
                {/* Dry Run Variables Panel Placeholder */}
                <div className="bg-white p-4 rounded-lg shadow border">
                  <h3 className="text-lg font-semibold mb-2">Variables</h3>
                  <pre className="text-xs bg-gray-50 p-2 rounded max-h-60 overflow-y-auto">
                    {Object.keys(currentDryRunState.variables).length > 0 ?
                      Object.entries(currentDryRunState.variables).map(([key, value]) => (
                        <div key={key}>{`${key}: ${JSON.stringify(value)}`}</div>
                      )) : "No variables."}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-6 flex items-center justify-center">
            <p className="text-xl text-gray-500">Please select an exercise to begin.</p>
          </div>
        )}

        {/* Right Panel: Input/Output & Online Users */}
        {/* This div will act as a container for both panels and their toggle buttons */}
        <div className="flex h-full sticky top-0">
          {/* Online Users Panel (New) */}
          {isOnlineUsersPanelOpen && currentUser && (
            <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto p-0"> {/* Adjusted padding */}
              <OnlineUsersPanel currentUserId={currentUser.uid} />
            </div>
          )}
          <button
            onClick={() => setIsOnlineUsersPanelOpen(!isOnlineUsersPanelOpen)}
            className="p-2 bg-gray-200 hover:bg-gray-300 h-full flex items-center justify-center z-10"
            title={isOnlineUsersPanelOpen ? "Hide Online Users" : "Show Online Users"}
          >
            {isOnlineUsersPanelOpen ? <ChevronRight size={20} /> : <Users size={20} />}
          </button>

          {/* Existing Input/Output Panel */}
          {currentExercise && (
            <>
              {isInputOutputOpen && (
                <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto"> {/* Ensure fixed width */}
                  <InputOutput
                    exercise={currentExercise}
                    result={executionResult}
                    isRunning={isRunning && !isDryRunMode}
                  />
                </div>
              )}
              <button
                onClick={() => setIsInputOutputOpen(!isInputOutputOpen)}
                className="p-2 bg-gray-200 hover:bg-gray-300 h-full flex items-center justify-center z-10"
                title={isInputOutputOpen ? "Collapse Input/Output Panel" : "Expand Input/Output Panel"}
              >
                {isInputOutputOpen ? <ChevronRight size={20} /> : <PanelRight size={20} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Chat Window */}
      {isChatOpen && <ChatWindow
                      onClose={() => setIsChatOpen(false)}
                      onFlowchartGenerated={handleNewFlowchartFromAI}
                   />}
        title={isChatOpen ? "Close AI Chat" : "Open AI Chat"}
        aria-label={isChatOpen ? "Close AI Chat" : "Open AI Chat"}
      
        {isChatOpen ? <X size={24} /> : <Bot size={24} />}

      {showDryRunInputModal && currentFlowchart && (
        <DryRunInputModal
          isOpen={showDryRunInputModal}
          onClose={() => setShowDryRunInputModal(false)}
          onSubmit={handleInitializeDryRun}
          flowchartNodes={currentFlowchart.nodes}
        />
      )}

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

