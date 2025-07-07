import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ExerciseContext { // Exporting
  exerciseId: string | null;
  title: string | null;
  userCode: string | null;
  isCorrect: boolean | null;
  errorMessage: string | null;
  previousHints: number | null;
}

import { FlowchartData } from '../types'; // Import FlowchartData

export interface ChatMessage { // Exporting
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isStructuredData?: boolean; // Added to indicate if 'text' is JSON for flowchart
}

interface ChatState {
  isVisible: boolean;
  currentExerciseId: string | null;
  exerciseContext: ExerciseContext | null;
  chatHistory: Record<string, ChatMessage[]>; // ExerciseId -> Messages
  generatedFlowchartData: FlowchartData | null; // For AI generated flowcharts
  toggleVisibility: () => void;
  setExerciseContext: (context: ExerciseContext) => void;
  addMessage: (exerciseId: string | null, message: ChatMessage) => void;
  loadHistory: (exerciseId: string | null) => ChatMessage[];
  setGeneratedFlowchartData: (data: FlowchartData | null) => void; // Setter for AI flowchart
  lastResyncRequested: number | null;
  requestResync: () => void;
  isCheatModeSource: boolean; // Added for cheat mode tracking
  setIsCheatModeSource: (isCheat: boolean) => void; // Added for cheat mode tracking
  isGeneratingFlowchart: boolean; // For spinner
  setIsGeneratingFlowchart: (isLoading: boolean) => void; // For spinner
}

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      isVisible: true,
      currentExerciseId: null,
      exerciseContext: null,
      chatHistory: {},
      generatedFlowchartData: null, // Initialize
      lastResyncRequested: null,
      isCheatModeSource: false, // Initialize cheat mode flag
      isGeneratingFlowchart: false, // Initialize loading flag
      toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
      requestResync: () => set({ lastResyncRequested: Date.now() }),
      setGeneratedFlowchartData: (data) => set({ generatedFlowchartData: data }), // Implement setter
      setIsCheatModeSource: (isCheat) => set({ isCheatModeSource: isCheat }), // Implement cheat mode setter
      setIsGeneratingFlowchart: (isLoading) => set({ isGeneratingFlowchart: isLoading }), // Implement loading setter
      setExerciseContext: (context) =>
        set((state) => {
          // When context changes, update currentExerciseId
          // and potentially load history if it's a new exercise
          const newExerciseId = context.exerciseId;
          return {
            exerciseContext: context,
            currentExerciseId: newExerciseId,
          };
        }),
      addMessage: (exerciseId, message) =>
        set((state) => {
          if (!exerciseId) return {}; // Do not add message if exerciseId is null
          const currentChatHistory = state.chatHistory || {}; // Ensure chatHistory is an object
          const history = currentChatHistory[exerciseId] || [];
          return {
            chatHistory: {
              ...currentChatHistory,
              [exerciseId]: [...history, message],
            },
          };
        }),
      loadHistory: (exerciseId) => {
        if (!exerciseId) return []; // Return empty history if exerciseId is null
        const currentChatHistory = get().chatHistory || {}; // Ensure chatHistory is an object
        return currentChatHistory[exerciseId] || [];
      },
    }),
    {
      name: 'exercise-chat-storage', // unique name
      getStorage: () => localStorage, // (optional) by default, 'localStorage' is used
    }
  )
);

export default useChatStore;
