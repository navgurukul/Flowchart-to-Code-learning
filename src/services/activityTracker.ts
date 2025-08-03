// src/services/activityTracker.ts
import { useAuth } from '../contexts/AuthContext';

class UserActivityTracker {
  private updateInterval: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private readonly ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  /**
   * Start tracking user activity and periodically update the backend
   */
  startTracking(getIdToken: () => Promise<string>) {
    this.stopTracking(); // Clear any existing interval
    
    // Update activity immediately
    this.updateActivity(getIdToken);
    
    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.updateActivity(getIdToken);
    }, this.ACTIVITY_UPDATE_INTERVAL);
    
    // Listen for user interactions to reset activity timer
    this.setupActivityListeners();
  }

  /**
   * Stop tracking user activity
   */
  stopTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.removeActivityListeners();
  }

  /**
   * Setup event listeners for user activity detection
   */
  private setupActivityListeners() {
    const events = ['click', 'keypress', 'scroll', 'mousemove'];
    
    events.forEach(event => {
      document.addEventListener(event, this.handleUserActivity, { passive: true });
    });
  }

  /**
   * Remove activity event listeners
   */
  private removeActivityListeners() {
    const events = ['click', 'keypress', 'scroll', 'mousemove'];
    
    events.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity);
    });
  }

  /**
   * Handle user activity events
   */
  private handleUserActivity = () => {
    this.lastActivityTime = Date.now();
  }

  /**
   * Update user activity on the backend
   */
  private async updateActivity(getIdToken: () => Promise<string>) {
    try {
      const token = await getIdToken();
      
      const response = await fetch(`${this.API_BASE_URL}/api/update-user-activity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to update user activity:', response.status);
      }
    } catch (error) {
      console.warn('Error updating user activity:', error);
    }
  }

  /**
   * Get time since last activity in minutes
   */
  getMinutesSinceLastActivity(): number {
    return Math.floor((Date.now() - this.lastActivityTime) / (1000 * 60));
  }

  /**
   * Check if user has been inactive for a specified duration
   */
  isInactive(minutes: number): boolean {
    return this.getMinutesSinceLastActivity() >= minutes;
  }
}

// Create singleton instance
export const userActivityTracker = new UserActivityTracker();