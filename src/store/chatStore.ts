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
// Import FlowchartPatchPayload, assuming its definition is moved to a shared types file or ../services/api
// For now, let's assume it's accessible or we'll define it here if not importing.
// If FlowchartPatchPayload is kept in api.ts, this import might need adjustment based on project structure rules.
import { FlowchartPatchPayload } from '../services/api';


export interface ChatMessage { // Exporting
  id: string;
  sender: 'user' | 'assistant';
  text: string; // Main textual content, could be the original error for diagnosed messages
  timestamp: number;
  isStructuredData?: boolean; // For /generate command's JSON flowchart output

  // Fields for error diagnosis and "Fix It" functionality
  originalError?: string;        // e.g., "NameError: input1 is not defined"
  friendlyExplanation?: string;  // LLM's explanation
  suggestedFix?: string;         // LLM's suggested fix
  flowchartPatch?: FlowchartPatchPayload | null; // The actual patch object from TutorResponse
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
