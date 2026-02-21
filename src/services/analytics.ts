import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from '../firebaseConfig';

// Analytics service for tracking user behavior
class AnalyticsService {
  // Track page views
  trackPageView(pageName: string) {
    if (!analytics) return;
    logEvent(analytics, 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
    console.log('📊 Analytics: Page view -', pageName);
  }

  // Track user login
  trackLogin(method: string, userId: string) {
    if (!analytics) return;
    setUserId(analytics, userId);
    logEvent(analytics, 'login', {
      method: method
    });
    console.log('📊 Analytics: User login -', method);
  }

  // Track user signup
  trackSignup(method: string) {
    if (!analytics) return;
    logEvent(analytics, 'sign_up', {
      method: method
    });
    console.log('📊 Analytics: User signup -', method);
  }

  // Set user properties
  setUserProperties(properties: Record<string, string>) {
    if (!analytics) return;
    setUserProperties(analytics, properties);
    console.log('📊 Analytics: User properties set', properties);
  }

  // Track lesson started
  trackLessonStarted(lessonId: number, lessonTitle: string) {
    if (!analytics) return;
    logEvent(analytics, 'lesson_started', {
      lesson_id: lessonId,
      lesson_title: lessonTitle
    });
    console.log('📊 Analytics: Lesson started -', lessonTitle);
  }

  // Track lesson completed
  trackLessonCompleted(lessonId: number, lessonTitle: string, timeSpent: number) {
    if (!analytics) return;
    logEvent(analytics, 'lesson_completed', {
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      time_spent_seconds: timeSpent
    });
    console.log('📊 Analytics: Lesson completed -', lessonTitle);
  }

  // Track exercise started
  trackExerciseStarted(exerciseId: number, exerciseTitle: string, difficulty: string) {
    if (!analytics) return;
    logEvent(analytics, 'exercise_started', {
      exercise_id: exerciseId,
      exercise_title: exerciseTitle,
      difficulty: difficulty
    });
    console.log('📊 Analytics: Exercise started -', exerciseTitle);
  }

  // Track exercise completed
  trackExerciseCompleted(
    exerciseId: number, 
    exerciseTitle: string, 
    score: number, 
    attempts: number,
    timeSpent: number
  ) {
    if (!analytics) return;
    logEvent(analytics, 'exercise_completed', {
      exercise_id: exerciseId,
      exercise_title: exerciseTitle,
      score: score,
      attempts: attempts,
      time_spent_seconds: timeSpent
    });
    console.log('📊 Analytics: Exercise completed -', exerciseTitle, 'Score:', score);
  }

  // Track code execution
  trackCodeExecution(exerciseId: number, success: boolean, executionTime: number) {
    if (!analytics) return;
    logEvent(analytics, 'code_executed', {
      exercise_id: exerciseId,
      success: success,
      execution_time_ms: executionTime
    });
    console.log('📊 Analytics: Code executed -', success ? 'Success' : 'Failed');
  }

  // Track flowchart created
  trackFlowchartCreated(exerciseId: number, nodeCount: number, edgeCount: number) {
    if (!analytics) return;
    logEvent(analytics, 'flowchart_created', {
      exercise_id: exerciseId,
      node_count: nodeCount,
      edge_count: edgeCount
    });
    console.log('📊 Analytics: Flowchart created - Nodes:', nodeCount, 'Edges:', edgeCount);
  }

  // Track AI import used
  trackAIImport(success: boolean, shapesDetected: number) {
    if (!analytics) return;
    logEvent(analytics, 'ai_import_used', {
      success: success,
      shapes_detected: shapesDetected
    });
    console.log('📊 Analytics: AI import -', success ? 'Success' : 'Failed', 'Shapes:', shapesDetected);
  }

  // Track dry run started
  trackDryRunStarted(exerciseId: number) {
    if (!analytics) return;
    logEvent(analytics, 'dry_run_started', {
      exercise_id: exerciseId
    });
    console.log('📊 Analytics: Dry run started');
  }

  // Track dry run completed
  trackDryRunCompleted(exerciseId: number, stepsExecuted: number) {
    if (!analytics) return;
    logEvent(analytics, 'dry_run_completed', {
      exercise_id: exerciseId,
      steps_executed: stepsExecuted
    });
    console.log('📊 Analytics: Dry run completed - Steps:', stepsExecuted);
  }

  // Track mode switch
  trackModeSwitch(fromMode: string, toMode: string) {
    if (!analytics) return;
    logEvent(analytics, 'mode_switched', {
      from_mode: fromMode,
      to_mode: toMode
    });
    console.log('📊 Analytics: Mode switched -', fromMode, '→', toMode);
  }

  // Track error
  trackError(errorType: string, errorMessage: string, context?: string) {
    if (!analytics) return;
    logEvent(analytics, 'error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      context: context || 'unknown'
    });
    console.log('📊 Analytics: Error -', errorType, errorMessage);
  }

  // Track feature usage
  trackFeatureUsed(featureName: string, details?: Record<string, any>) {
    if (!analytics) return;
    logEvent(analytics, 'feature_used', {
      feature_name: featureName,
      ...details
    });
    console.log('📊 Analytics: Feature used -', featureName);
  }

  // Track engagement time
  trackEngagement(sessionDuration: number, activeTime: number) {
    if (!analytics) return;
    logEvent(analytics, 'user_engagement', {
      session_duration_seconds: sessionDuration,
      active_time_seconds: activeTime
    });
    console.log('📊 Analytics: Engagement - Session:', sessionDuration, 'Active:', activeTime);
  }

  // Track search
  trackSearch(searchTerm: string, resultsCount: number) {
    if (!analytics) return;
    logEvent(analytics, 'search', {
      search_term: searchTerm,
      results_count: resultsCount
    });
    console.log('📊 Analytics: Search -', searchTerm);
  }

  // Track share
  trackShare(contentType: string, contentId: string, method: string) {
    if (!analytics) return;
    logEvent(analytics, 'share', {
      content_type: contentType,
      content_id: contentId,
      method: method
    });
    console.log('📊 Analytics: Share -', contentType, contentId);
  }

  // Track tutorial progress
  trackTutorialProgress(step: number, completed: boolean) {
    if (!analytics) return;
    logEvent(analytics, 'tutorial_progress', {
      step: step,
      completed: completed
    });
    console.log('📊 Analytics: Tutorial -', completed ? 'Completed' : 'Step', step);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
