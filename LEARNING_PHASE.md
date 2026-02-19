# Learning Phase Feature

## Overview

The application now includes a comprehensive learning phase where users can read educational materials before starting exercises. This helps beginners understand programming fundamentals before diving into practical challenges.

## Features

### 1. Two Modes
- **Learn Mode**: Read educational lessons with rich content
- **Practice Mode**: Work on programming exercises (existing functionality)

### 2. Learning Materials
Six comprehensive lessons covering:
1. What is Programming? - Fundamentals and computational thinking
2. Introduction to Flowcharts - Visual representation of logic
3. Understanding Variables - Data storage and manipulation
4. Conditional Logic - Decision making in programs
5. Loops and Repetition - Efficient code repetition
6. Problem-Solving Strategies - Systematic approaches to challenges

### 3. Progress Tracking
- Track completed lessons
- Visual progress bar
- Persistent storage (localStorage)
- Separate tracking for logged-in and anonymous users

### 4. User Experience
- Clean, readable lesson viewer with markdown support
- Syntax-highlighted code examples
- Estimated reading time for each lesson
- Category-based organization
- "Mark as Complete" functionality
- Automatic progression to next lesson

### 5. Transition to Practice
- After completing all lessons, users see a congratulations message
- Clear call-to-action to start practicing with exercises
- Seamless mode switching between learning and practice

## Implementation Details

### New Files Created
- `src/data/lessons.ts` - Lesson content and structure
- `src/components/LessonViewer.tsx` - Displays individual lessons
- `src/components/LessonList.tsx` - Shows all available lessons

### Modified Files
- `src/App.tsx` - Added learning mode state and UI integration

### State Management
```typescript
const [isLearningMode, setIsLearningMode] = useState(true);
const [completedLessons, setCompletedLessons] = useState<number[]>([]);
const [currentLessonId, setCurrentLessonId] = useState<number | null>(1);
```

### Data Persistence
- Completed lessons stored in localStorage
- Separate keys for authenticated and anonymous users
- Format: `completedLessons_${userId}` or `completedLessons_anonymous`

## Usage

### For Users
1. Start the application - you'll be in Learn mode by default
2. Select a lesson from the left panel
3. Read the content
4. Click "Mark as Complete" when finished
5. Progress automatically to the next lesson
6. After completing all lessons, click "Start Practicing with Exercises"
7. Switch between modes anytime using the top navigation

### For Developers
To add new lessons, edit `src/data/lessons.ts`:

```typescript
{
  id: 7,
  title: "Your Lesson Title",
  description: "Brief description",
  duration: "X min read",
  category: 'basics' | 'flowcharts' | 'logic' | 'advanced',
  order: 7,
  content: `
    # Markdown content here
    Your lesson content with markdown formatting
  `
}
```

## Benefits

1. **Better Onboarding**: New users learn fundamentals before coding
2. **Reduced Frustration**: Users understand concepts before applying them
3. **Self-Paced Learning**: Read at your own speed
4. **Reference Material**: Can return to lessons anytime
5. **Progressive Disclosure**: Information presented in logical order

## Future Enhancements

Potential improvements:
- Quiz questions after each lesson
- Interactive code examples within lessons
- Video content integration
- Lesson search functionality
- Bookmarking favorite lessons
- Lesson completion certificates
- Adaptive learning paths based on user performance
