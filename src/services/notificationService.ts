// src/services/notificationService.ts
import { getDatabase, ref, onValue, off } from 'firebase/database';
import toast from 'react-hot-toast';
import { app } from '../firebaseConfig';

export interface UserPresence {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  currentFlowchartId: string | null;
  currentNodeId: string | null;
  lastSeen: number;
  status: 'online' | 'idle' | 'offline';
}

export class NotificationService {
  private db = getDatabase(app);
  private onlineUsersRef = ref(this.db, 'onlineUsers');
  private currentOnlineUsers = new Set<string>();
  private currentUserId: string | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.setupOnlineUserListener();
  }

  /**
   * Set the current user ID to filter out self-notifications
   */
  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
  }

  /**
   * Setup real-time listener for online users to detect new arrivals
   */
  private setupOnlineUserListener() {
    this.unsubscribe = onValue(this.onlineUsersRef, (snapshot) => {
      const usersData = snapshot.val();
      
      if (usersData) {
        const currentOnlineUserIds = new Set<string>();
        
        // Get all currently online users
        Object.values(usersData).forEach((user: any) => {
          if (user && user.status === 'online' && user.uid) {
            currentOnlineUserIds.add(user.uid);
            
            // Check if this is a new user coming online
            if (!this.currentOnlineUsers.has(user.uid) && 
                user.uid !== this.currentUserId) {
              this.showUserJoinedNotification(user);
            }
          }
        });
        
        // Update our tracking set
        this.currentOnlineUsers = currentOnlineUserIds;
      } else {
        // No users online
        this.currentOnlineUsers.clear();
      }
    }, (error) => {
      console.error('Error listening to online users:', error);
    });
  }

  /**
   * Show a notification when a user joins online
   */
  private showUserJoinedNotification(user: UserPresence) {
    const userName = user.displayName || 'Someone';
    const message = `${userName} just joined the learning session! 🎉`;
    
    toast.success(message, {
      duration: 4000,
      icon: '👋',
      style: {
        background: '#10B981',
        color: '#fff',
      },
      position: 'top-right',
    });
  }

  /**
   * Show notification when user starts working on a specific exercise
   */
  showUserStartedExerciseNotification(userName: string, exerciseId: string) {
    const message = `${userName} started working on ${exerciseId.replace('exercise-', 'Exercise ')} 💪`;
    
    toast(`${message}`, {
      duration: 3000,
      icon: '🚀',
      style: {
        background: '#3B82F6',
        color: '#fff',
      },
      position: 'top-right',
    });
  }

  /**
   * Show notification for user achievements
   */
  showUserAchievementNotification(userName: string, achievement: string) {
    const message = `${userName} ${achievement} 🏆`;
    
    toast.success(message, {
      duration: 5000,
      icon: '🎊',
      style: {
        background: '#8B5CF6',
        color: '#fff',
      },
      position: 'top-right',
    });
  }

  /**
   * Cleanup the notification service
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.currentOnlineUsers.clear();
  }
}

// Create a singleton instance
export const notificationService = new NotificationService();