import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Mission } from '../types/quests';
import { allQuests } from '../data/quests'; // Import all quests

type GameStatus = 'idle' | 'playing' | 'success' | 'failed';

interface GameState {
  currentMissionId: string | null;
  currentMission: Mission | null;
  completedMissions: Set<string>;
  score: number;
  status: GameStatus;
  feedbackMessage: string | null;
}

interface GameContextType extends GameState {
  startMission: (missionId: string) => void;
  completeMission: (missionId: string, awardedXp: number) => void;
  submitAttempt: (isCorrect: boolean, message?: string) => void;
  selectNextMission: () => void;
  resetGameStatus: () => void;
  getCurrentMissionDetails: ()_ => Mission | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>({
    currentMissionId: null,
    currentMission: null,
    completedMissions: new Set<string>(),
    score: 0,
    status: 'idle',
    feedbackMessage: null,
  });

  const startMission = useCallback((missionId: string) => {
    const missionToStart = allQuests.find(q => q.id === missionId);
    if (missionToStart) {
      setGameState(prev => ({
        ...prev,
        currentMissionId: missionId,
        currentMission: missionToStart,
        status: 'playing',
        feedbackMessage: null,
      }));
    } else {
      console.error(`Mission with ID ${missionId} not found.`);
      setGameState(prev => ({ ...prev, status: 'idle', feedbackMessage: 'Error: Mission not found.' }));
    }
  }, []);

  const completeMission = useCallback((missionId: string, awardedXp: number) => {
    setGameState(prev => {
      const newCompletedMissions = new Set(prev.completedMissions);
      newCompletedMissions.add(missionId);
      return {
        ...prev,
        completedMissions: newCompletedMissions,
        score: prev.score + awardedXp,
        status: 'success',
        feedbackMessage: `Quest Complete! You earned ${awardedXp} XP!`,
      };
    });
  }, []);

  const submitAttempt = useCallback((isCorrect: boolean, message?: string) => {
    if (isCorrect && gameState.currentMission) {
      completeMission(gameState.currentMission.id, gameState.currentMission.xpReward);
    } else {
      setGameState(prev => ({
        ...prev,
        status: 'failed',
        feedbackMessage: message || 'Not quite right. Try adjusting your flowchart!',
      }));
    }
  }, [gameState.currentMission, completeMission]);

  const selectNextMission = useCallback(() => {
    const currentIdx = allQuests.findIndex(q => q.id === gameState.currentMissionId);
    let nextMission: Mission | undefined = undefined;

    // Try to find the next uncompleted mission
    for (let i = 0; i < allQuests.length; i++) {
        const potentialNextMission = allQuests[(currentIdx + 1 + i) % allQuests.length];
        if (!gameState.completedMissions.has(potentialNextMission.id)) {
            nextMission = potentialNextMission;
            break;
        }
    }

    if (nextMission) {
      startMission(nextMission.id);
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


  return (
    <GameContext.Provider value={{ ...gameState, startMission, completeMission, submitAttempt, selectNextMission, resetGameStatus, getCurrentMissionDetails }}>
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
