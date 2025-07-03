import React, { useEffect, useState, useCallback } from 'react';
import { GameProvider, useGame } from '../contexts/GameContext';
import { FlowchartBuilder } from '../components/FlowchartBuilder';
import { FlowchartData, Exercise as ExerciseType } from '../types'; // Reusing ExerciseType for FlowchartBuilder prop
import { Mission } from '../types/quests';
import { allQuests } from '../data/quests';
import { generateCodeFromFlowchartObject, normalizeCode } from '../utils/flowchartProcessor';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component like this
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming shadcn/ui Card
import Confetti from 'react-confetti';
import { Header } from '../components/Header'; // Re-using existing Header
import { useAuth } from '../contexts/AuthContext'; // To get user for potential progress saving

// This component will be wrapped by GameProvider in your routing setup
const GamePageContent: React.FC = () => {
  const {
    currentMission,
    score,
    status,
    feedbackMessage,
    startMission,
    submitAttempt,
    selectNextMission,
    resetGameStatus,
    completedMissions
  } = useGame();

  const [userFlowchartData, setUserFlowchartData] = useState<FlowchartData>({ nodes: [], edges: [] });
  const [generatedQuestCode, setGeneratedQuestCode] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);

  const { currentUser } = useAuth(); // For potential Firebase saving

  useEffect(() => {
    // Start the first uncompleted quest when the page loads or when all quests are done and it resets
    if (!currentMission) {
        const firstUncompletedQuest = allQuests.find(q => !completedMissions.has(q.id));
        if (firstUncompletedQuest) {
            startMission(firstUncompletedQuest.id);
        } else if (allQuests.length > 0) {
            // All quests completed, or no quests available
            // GameContext's selectNextMission handles the "all complete" message
            // If starting fresh and allQuests is empty, this will do nothing.
            // If starting fresh and allQuests has items, it finds the first.
             startMission(allQuests[0].id); // Default to first if all are somehow completed or list is fresh
        }
    }
  }, [startMission, currentMission, completedMissions]);

  useEffect(() => {
    if (status === 'success') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000); // Confetti for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleFlowchartUpdate = useCallback((flowchartData: FlowchartData) => {
    setUserFlowchartData(flowchartData);
    // Automatically generate code preview as flowchart changes.
    // The FlowchartBuilder's onGenerateCode is tied to its internal button.
    // For a more reactive UI, FlowchartBuilder would need an onFlowchartChange prop.
    // For now, we rely on its internal "Generate Code" button to trigger this callback.
    const code = generateCodeFromFlowchartObject(flowchartData);
    setGeneratedQuestCode(code);
  }, []);

  const handleSubmitSolution = () => {
    if (!currentMission) return;

    // Note: generateCodeFromFlowchartObject is called in handleFlowchartUpdate.
    // We use the code stored in generatedQuestCode state.
    // This assumes user clicked "Generate Code" in FlowchartBuilder which calls handleFlowchartUpdate.

    const userCodeNormalized = normalizeCode(generatedQuestCode);
    const expectedCodeNormalized = normalizeCode(currentMission.expectedCode);

    console.log("User Code Normalized:", userCodeNormalized);
    console.log("Expected Code Normalized:", expectedCodeNormalized);

    if (userCodeNormalized === expectedCodeNormalized) {
      submitAttempt(true);
    } else {
      submitAttempt(false, 'The generated code does not match the expected solution. Check your flowchart logic and try again!');
    }
  };

  // Adapt Mission to ExerciseType for FlowchartBuilder
  // FlowchartBuilder expects an 'exercise' prop. We'll map our mission to this.
  const mapMissionToExerciseAdapter = (mission: Mission | null): ExerciseType | null => {
    if (!mission) return null;
    return {
      id: mission.id.hashCode(), // Simple hash for a number ID. Or use a fixed dummy ID.
      title: mission.title,
      description: mission.description,
      problemStatement: mission.problemStatement,
      sampleInput: mission.sampleInput ? JSON.stringify(mission.sampleInput) : '',
      expectedOutput: mission.expectedOutput ? JSON.stringify(mission.expectedOutput) : '',
      difficulty: mission.difficulty,
      category: 'Quest', // Hardcoded category
      hints: mission.hints || [],
      requiredNodes: mission.requiredNodes || [],
    };
  };

  // Helper for ID generation if needed by FlowchartBuilder (it uses exercise.id for some keys)
  String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash); // Ensure positive for safety, though type is just number
  };


  const currentExerciseAdapter = mapMissionToExerciseAdapter(currentMission);

  if (!currentMission || !currentExerciseAdapter) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header progress={{ completedExercises: Array.from(completedMissions).map(id => id.hashCode()), currentExercise: 0, totalScore: score, lastAccessedAt: new Date().toISOString() }} onOpenGuide={() => {}} />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>All Quests Cleared!</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{feedbackMessage || "No more quests available right now. Check back later!"}</p>
              <p className="mt-4 text-2xl font-bold">Total Score: {score}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {showConfetti && <Confetti recycle={false} />}
      <Header progress={{ completedExercises: Array.from(completedMissions).map(id => id.hashCode()), currentExercise: currentMission.id.hashCode(), totalScore: score, lastAccessedAt: new Date().toISOString() }} onOpenGuide={() => {}} />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold">{currentMission.title}</CardTitle>
                <CardDescription className="text-md text-gray-600">{currentMission.description}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Difficulty: <span className={`capitalize font-semibold ${
                    currentMission.difficulty === 'easy' ? 'text-green-500' :
                    currentMission.difficulty === 'medium' ? 'text-yellow-500' : 'text-red-500'
                }`}>{currentMission.difficulty}</span></p>
                <p className="text-sm text-gray-500">XP Reward: <span className="font-semibold text-blue-500">{currentMission.xpReward}</span></p>
                <p className="text-lg font-bold">Score: {score}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-2"><strong>Problem:</strong> {currentMission.problemStatement}</p>
            {currentMission.hints && currentMission.hints.length > 0 && (
              <details className="mb-4 text-sm">
                <summary className="cursor-pointer font-semibold text-blue-600">Need a hint?</summary>
                <ul className="list-disc pl-5 mt-1 text-gray-600">
                  {currentMission.hints.map((hint, index) => <li key={index}>{hint}</li>)}
                </ul>
              </details>
            )}
             {currentMission.requiredNodes && currentMission.requiredNodes.length > 0 && (
                <p className="text-sm text-gray-600">
                    <strong>Required Node Types:</strong> {currentMission.requiredNodes.join(', ')}
                </p>
            )}
          </CardContent>
        </Card>

        {status === 'playing' && (
          <div className="h-[600px] md:h-[700px] border rounded-lg shadow-lg">
            <FlowchartBuilder
              exercise={currentExerciseAdapter} // Pass the adapted mission
              onGenerateCode={handleFlowchartUpdate} // This is triggered by FB's internal "Generate Code" button
              onRunCode={() => {}} // We are not using FB's run functionality here
              isRunning={false} // Not using FB's run functionality
              newFlowchartToLoad={null} // No AI flowchart loading for now
            />
          </div>
        )}

        {status === 'playing' && generatedQuestCode && (
            <Card>
                <CardHeader><CardTitle className="text-lg">Generated Code Preview</CardTitle></CardHeader>
                <CardContent>
                    <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto"><code>{generatedQuestCode}</code></pre>
                    <p className="text-xs text-gray-500 mt-2">Click "Generate Code" in the Flowchart Builder to update this preview.</p>
                </CardContent>
            </Card>
        )}


        {status !== 'idle' && feedbackMessage && (
          <Card className={`mt-4 ${status === 'success' ? 'bg-green-50 border-green-400' : status === 'failed' ? 'bg-red-50 border-red-400' : 'bg-blue-50 border-blue-400'}`}>
            <CardContent className="p-4">
              <p className={`text-center font-semibold ${status === 'success' ? 'text-green-700' : status === 'failed' ? 'text-red-700' : 'text-blue-700'}`}>
                {feedbackMessage}
              </p>
            </CardContent>
          </Card>
        )}

        <CardFooter className="flex justify-center gap-4 py-4">
          {status === 'playing' && (
            <Button onClick={handleSubmitSolution} size="lg" disabled={!generatedQuestCode}>
              Submit Quest Solution
            </Button>
          )}
          {status === 'success' && (
            <Button onClick={selectNextMission} size="lg" variant="success">
              Next Quest
            </Button>
          )}
          {status === 'failed' && (
            <Button onClick={resetGameStatus} size="lg" variant="outline">
              Try Again
            </Button>
          )}
        </CardFooter>
      </main>
    </div>
  );
};

// Main GamePage component that includes the Provider
const GamePage: React.FC = () => {
  return (
    <GameProvider>
      <GamePageContent />
    </GameProvider>
  );
};

export default GamePage;

// Helper to add hashCode to String prototype if not already there for adapter
declare global {
  interface String {
    hashCode(): number;
  }
}
if (!String.prototype.hashCode) {
  String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };
}
