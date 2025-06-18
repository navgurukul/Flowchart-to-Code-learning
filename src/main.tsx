import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import { UserProgressProvider } from './contexts/UserProgressContext'; // Import UserProgressProvider

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider> {/* AuthProvider wraps UserProgressProvider and App */}
      <UserProgressProvider> {/* UserProgressProvider wraps App */}
        <App />
      </UserProgressProvider>
    </AuthProvider>
  </StrictMode>
);
