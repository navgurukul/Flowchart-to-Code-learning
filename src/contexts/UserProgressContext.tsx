// src/contexts/UserProgressContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext'; // Assuming AuthContext is in the same directory or adjust path

// 1. Define Types/Interfaces
interface UserProgressData {
  points: number;
  tasks_completed: string[]; // List of exercise IDs
  last_active: string; // ISO string date from backend (Firestore datetime will be converted)
}

interface UserProgressContextType {
  progress: UserProgressData | null;
  loading: boolean;
  error: Error | null;
  fetchUserProgress: (uid: string) => Promise<void>;
  completeExercise: (uid: string, exerciseId: string, pointsEarned: number) => Promise<void>;
  clearUserProgress: () => void;
}

// 2. Create the Context
const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

// Base URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 3. Implement UserProgressProvider Component
export const UserProgressProvider: FC<{children: ReactNode}> = ({ children }) => {
  const [progress, setProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start with loading true
  const [error, setError] = useState<Error | null>(null);

  const { currentUser } = useAuth();

  const fetchUserProgress = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${uid}/details`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch user progress: ${response.statusText}`);
      }
      const data: UserProgressData = await response.json();
      setProgress(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(new Error(errorMessage));
      toast.error(`Error fetching progress: ${errorMessage}`);
      setProgress(null); // Clear progress on error
    } finally {
      setLoading(false);
    }
  };

  const completeExercise = async (uid: string, exerciseId: string, pointsEarned: number) => {
    // Consider a different loading state for this action if needed, e.g., submitting
    setLoading(true); // Or a specific submitting state like setIsSubmitting(true)
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${uid}/complete-exercise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exerciseId, pointsEarned }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to complete exercise: ${response.statusText}`);
      }
      // const result = await response.json(); // Contains { message: "..." }
      toast.success("Exercise progress updated!");
      await fetchUserProgress(uid); // Refresh user progress after successful update
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(new Error(errorMessage));
      toast.error(`Error completing exercise: ${errorMessage}`);
      // setLoading(false) will be handled by fetchUserProgress if it's called,
      // but if fetchUserProgress isn't called due to early exit, ensure loading is false.
      // However, fetchUserProgress will always be called here after try/catch.
    } finally {
      // setLoading(false); // fetchUserProgress will handle the final loading state
      // If fetchUserProgress errors, its finally block will set loading to false.
      // If it succeeds, its finally block will set loading to false.
    }
  };

  const clearUserProgress = () => {
    setProgress(null);
    setError(null);
    setLoading(false); // Set loading to false as there's nothing to load
  };

  // Effect for Auth Changes
  useEffect(() => {
    if (currentUser?.uid) {
      fetchUserProgress(currentUser.uid);
    } else {
      clearUserProgress();
    }
  }, [currentUser]); // Dependency on currentUser

  const contextValue = {
    progress,
    loading,
    error,
    fetchUserProgress,
    completeExercise,
    clearUserProgress,
  };

  return (
    <UserProgressContext.Provider value={contextValue}>
      {children}
    </UserProgressContext.Provider>
  );
};

// 4. Create useUserProgress Hook
export const useUserProgress = () => {
  const context = useContext(UserProgressContext);
  if (context === undefined) {
    throw new Error('useUserProgress must be used within a UserProgressProvider');
  }
  return context;
};
