import create from 'zustand';
import { persist } from 'zustand/middleware';

export interface ExerciseContext { // Exporting
  exerciseId: string | null;
  title: string | null;
  userCode: string | null;
  isCorrect: boolean | null;
  errorMessage: string | null;
  previousHints: number | null;
}

export interface ChatMessage { // Exporting
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface ChatState {
  isVisible: boolean;
  currentExerciseId: string | null;
  exerciseContext: ExerciseContext | null;
  chatHistory: Record<string, ChatMessage[]>; // ExerciseId -> Messages
  toggleVisibility: () => void;
  setExerciseContext: (context: ExerciseContext) => void;
  addMessage: (exerciseId: string | null, message: ChatMessage) => void;
  loadHistory: (exerciseId: string | null) => ChatMessage[];
  lastResyncRequested: number | null;
  requestResync: () => void;
}

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      isVisible: true,
      currentExerciseId: null,
      exerciseContext: null,
      chatHistory: {},
      lastResyncRequested: null,
      toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
      requestResync: () => set({ lastResyncRequested: Date.now() }),
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
          const history = state.chatHistory[exerciseId] || [];
          return {
            chatHistory: {
              ...state.chatHistory,
              [exerciseId]: [...history, message],
            },
          };
        }),
      loadHistory: (exerciseId) => {
        if (!exerciseId) return []; // Return empty history if exerciseId is null
        return get().chatHistory[exerciseId] || [];
      },
    }),
    {
      name: 'exercise-chat-storage', // unique name
      getStorage: () => localStorage, // (optional) by default, 'localStorage' is used
    }
  )
);

export default useChatStore;
