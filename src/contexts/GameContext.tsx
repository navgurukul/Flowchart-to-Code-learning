import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Mission } from '../types/quests';
import { allQuests } from '../data/quests';
import { useAuth } from './AuthContext'; // Assuming AuthContext is in the same folder or adjust path
import { getDatabase, ref as dbRef, set, get } from 'firebase/database';
import { app as firebaseApp } from '../firebaseConfig'; // Your Firebase app instance

type GameStatus = 'idle' | 'playing' | 'success' | 'failed' | 'loading'; // Added loading state

interface GameState {
  currentMissionId: string | null;
  currentMission: Mission | null;
  completedMissions: Set<string>;
  score: number;
  status: GameStatus;
  feedbackMessage: string | null;
}

// Firebase data structure
interface FirebaseGameProgress {
  completedMissions: string[];
  score: number;
  currentMissionId?: string | null;
  lastPlayed: string;
}

interface GameContextType extends GameState {
  startMission: (missionId: string) => void;
  // completeMission is internal now, triggered by submitAttempt
  submitAttempt: (isCorrect: boolean, message?: string) => void;
  selectNextMission: () => void;
  resetGameStatus: () => void;
  getCurrentMissionDetails: () => Mission | null; // Corrected return type
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialGameState: GameState = {
  currentMissionId: null,
  currentMission: null,
  completedMissions: new Set<string>(),
  score: 0,
  status: 'loading', // Start in loading state
  feedbackMessage: null,
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const { currentUser } = useAuth();

  const saveGameProgress = useCallback(async (stateToSave: GameState) => {
    if (currentUser?.uid && dbRef) {
      const gameProgressRef = dbRef(getDatabase(firebaseApp), `userGameProgress/${currentUser.uid}`);
      try {
        const dataToSave: FirebaseGameProgress = {
          completedMissions: Array.from(stateToSave.completedMissions),
          score: stateToSave.score,
          currentMissionId: stateToSave.currentMissionId,
          lastPlayed: new Date().toISOString(),
        };
        await set(gameProgressRef, dataToSave);
        console.log('Game progress saved to Firebase.');
      } catch (error) {
        console.error('Error saving game progress to Firebase:', error);
      }
    }
  }, [currentUser]);

  const startMission = useCallback((missionId: string) => {
    const missionToStart = allQuests.find(q => q.id === missionId);
    if (missionToStart) {
      setGameState(prev => {
        const newState = {
          ...prev,
          currentMissionId: missionId,
          currentMission: missionToStart,
          status: 'playing' as GameStatus,
          feedbackMessage: null,
        };
        saveGameProgress(newState); // Save when a new mission starts
        return newState;
      });
    } else {
      console.error(`Mission with ID ${missionId} not found.`);
      setGameState(prev => ({ ...prev, status: 'idle', feedbackMessage: 'Error: Mission not found.' }));
    }
  }, []);

  // completeMission is now an internal helper, called by submitAttempt
  const completeMissionInternal = useCallback((missionId: string, awardedXp: number) => {
    setGameState(prev => {
      const newCompletedMissions = new Set(prev.completedMissions);
      newCompletedMissions.add(missionId);
      const newScore = prev.score + awardedXp;

      const updatedState: GameState = {
        ...prev,
        completedMissions: newCompletedMissions,
        score: newScore,
        status: 'success' as GameStatus,
        feedbackMessage: `Quest Complete! You earned ${awardedXp} XP!`,
      };
      saveGameProgress(updatedState); // Save after state is updated internally
      return updatedState;
    });
  }, [saveGameProgress]);

  const submitAttempt = useCallback((isCorrect: boolean, message?: string) => {
    if (isCorrect && gameState.currentMission) {
      completeMissionInternal(gameState.currentMission.id, gameState.currentMission.xpReward); // Call internal version
    } else {
      setGameState(prev => ({
        ...prev,
        status: 'failed',
        feedbackMessage: message || 'Not quite right. Try adjusting your flowchart!',
      }));
    }
  }, [gameState.currentMission, completeMissionInternal]); // Depends on internal version

  const selectNextMission = useCallback(() => {
    const currentIdx = gameState.currentMissionId ? allQuests.findIndex(q => q.id === gameState.currentMissionId) : -1;
    let nextMission: Mission | undefined = undefined;

    // Try to find the next uncompleted mission
    for (let i = 0; i < allQuests.length; i++) {
      // Start search from current + 1, wrapping around
      const potentialNextMission = allQuests[(currentIdx + 1 + i) % allQuests.length];
      if (!gameState.completedMissions.has(potentialNextMission.id)) {
        nextMission = potentialNextMission;
        break;
      }
    }

    if (nextMission) {
      startMission(nextMission.id); // startMission will also save
    } else {
      // All missions completed or no other mission available
      setGameState(prev => ({
        ...prev,
        currentMissionId: null,
        currentMission: null,
        status: 'idle',
        feedbackMessage: 'Congratulations! You have completed all available quests!',
      }));
    }
  }, [gameState.currentMissionId, gameState.completedMissions, startMission]);

  const resetGameStatus = useCallback(() => {
    setGameState(prev => ({
        ...prev,
        status: 'playing', // Go back to playing state for the current mission
        feedbackMessage: null,
    }));
  }, []);

  const getCurrentMissionDetails = useCallback(() => {
    return gameState.currentMission;
  }, [gameState.currentMission]);


  // Effect to load progress when provider mounts or user changes
  useEffect(() => {
    const loadGameProgress = async () => {
      if (currentUser?.uid && dbRef) {
        setGameState(prev => ({ ...prev, status: 'loading' })); // Set loading state
        const gameProgressRef = dbRef(getDatabase(firebaseApp), `userGameProgress/${currentUser.uid}`);
        try {
          const snapshot = await get(gameProgressRef);
          if (snapshot.exists()) {
            const loadedData = snapshot.val() as FirebaseGameProgress;
            const loadedCompletedMissions = new Set<string>(loadedData.completedMissions || []);
            const lastMissionId = loadedData.currentMissionId;
            let missionToStart: Mission | null = null;

            if (lastMissionId) {
                missionToStart = allQuests.find(q => q.id === lastMissionId) || null;
            }
            // If no last mission or not found, find first uncompleted
            if (!missionToStart) {
                missionToStart = allQuests.find(q => !loadedCompletedMissions.has(q.id)) || null;
            }
            // If still no mission (e.g. all completed or no quests exist), currentMission remains null

            setGameState({
              completedMissions: loadedCompletedMissions,
              score: loadedData.score || 0,
              currentMissionId: missionToStart ? missionToStart.id : null,
              currentMission: missionToStart,
              status: missionToStart ? 'playing' : 'idle', // If a mission is loaded, status is playing
              feedbackMessage: null,
            });
            console.log('Game progress loaded from Firebase.');
          } else {
            // No saved progress, start with the first quest if available
            const firstQuest = allQuests.length > 0 ? allQuests.find(q => !gameState.completedMissions.has(q.id)) || allQuests[0] : null;
            if (firstQuest) {
              // Call startMission which handles setting state and saving this initial state
              startMission(firstQuest.id);
            } else {
              // No quests at all, or all somehow completed from a previous non-existent state
              setGameState(prev => ({ ...prev, status: 'idle', feedbackMessage: "No quests available to start."}));
            }
            console.log('No game progress found in Firebase for user. Starting fresh or with first quest.');
          }
        } catch (error) {
          console.error('Error loading game progress from Firebase:', error);
          setGameState(prev => ({ ...prev, status: 'idle', feedbackMessage: 'Error loading progress.' }));
        }
      } else if (!currentUser) {
        // Reset to initial state if user logs out
        setGameState(initialGameState);
      }
    };

    loadGameProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Dependencies: currentUser. startMission is stable due to useCallback.

  return (
    <GameContext.Provider value={{ ...gameState, startMission, submitAttempt, selectNextMission, resetGameStatus, getCurrentMissionDetails }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
