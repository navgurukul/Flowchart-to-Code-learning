// flowchartManager.js

const FLOWCHART_STORAGE_PREFIX = 'flowchart_exercise_';

/**
 * Saves the flowchart state for a given exercise ID to localStorage.
 * @param {string} exerciseId - The ID of the exercise.
 * @param {object} flowchartData - The flowchart data (JSON object) to save.
 */
function saveFlowchartState(exerciseId, flowchartData) {
  if (!exerciseId) {
    console.error('Exercise ID is required to save flowchart state.');
    return;
  }
  if (typeof flowchartData !== 'object' || flowchartData === null) {
    console.error('Flowchart data must be an object.');
    return;
  }

  try {
    const key = `${FLOWCHART_STORAGE_PREFIX}${exerciseId}`;
    const serializedData = JSON.stringify(flowchartData);
    localStorage.setItem(key, serializedData);
    console.log(`Flowchart saved for exercise ${exerciseId}`);
  } catch (error) {
    console.error(`Error saving flowchart for exercise ${exerciseId}:`, error);
  }
}

/**
 * Loads the flowchart state for a given exercise ID from localStorage.
 * @param {string} exerciseId - The ID of the exercise.
 * @returns {object | null} The flowchart data if found, otherwise null.
 */
function loadFlowchartState(exerciseId) {
  if (!exerciseId) {
    console.error('Exercise ID is required to load flowchart state.');
    return null;
  }

  try {
    const key = `${FLOWCHART_STORAGE_PREFIX}${exerciseId}`;
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      console.log(`No saved flowchart found for exercise ${exerciseId}`);
      return null;
    }
    const flowchartData = JSON.parse(serializedData);
    console.log(`Flowchart loaded for exercise ${exerciseId}`);
    return flowchartData;
  } catch (error) {
    console.error(`Error loading flowchart for exercise ${exerciseId}:`, error);
    return null;
  }
}

/**
 * (Placeholder)
 * This function will be responsible for getting the current flowchart data
 * from your flowchart library/drawing logic.
 * It needs to be implemented based on how your flowchart builder exposes its data.
 * @returns {object} The current flowchart data.
 */
function getCurrentFlowchartData() {
  console.warn('getCurrentFlowchartData() is a placeholder and needs to be implemented for your actual flowchart.');
  // For demo purposes, try to parse JSON from the canvas if it exists
  const canvas = document.getElementById('flowchart-canvas');
  try {
    if (canvas && canvas.textContent.trim().startsWith('{')) {
      const data = JSON.parse(canvas.textContent);
      console.log("Demo: Parsed current data from canvas content.", data);
      return data;
    }
  } catch (e) {
    console.warn("Demo: Could not parse JSON from canvas, returning default.", e);
  }
  // Fallback to default if not parsable or not there
  return {
    nodes: [{ id: 'node1', type: 'start', content: 'Start (Default)' }],
    edges: [],
    timestamp: new Date().toISOString() // Added to see changes
  };
}

/**
 * (Placeholder)
 * This function will be responsible for rendering the flowchart on the canvas.
 * It needs to be implemented based on how your flowchart library/drawing logic works.
 * @param {object} flowchartData - The flowchart data to render.
 */
function renderFlowchart(flowchartData) {
  // In a real scenario, this would use your flowchart library to draw the diagram.
  console.warn('renderFlowchart() is a placeholder. IMPLEMENT WITH YOUR FLOWCHART LIBRARY.');
  const canvas = document.getElementById('flowchart-canvas');
  if (canvas) {
    if (flowchartData) {
      console.log('Rendering flowchart with data:', flowchartData);
      // Demo implementation: Display JSON in the canvas div.
      // Replace this with your actual flowchart rendering logic.
      canvas.textContent = JSON.stringify(flowchartData, null, 2);
    } else {
      // This case should ideally be handled by clearFlowchartCanvas if flowchartData is null
      console.log('No flowchart data to render, clearing canvas as fallback.');
      canvas.textContent = 'New Exercise - Start building your flowchart!';
    }
  } else {
    console.error('Flowchart canvas element not found.');
  }
}

/**
 * (Placeholder)
 * This function will clear the flowchart canvas.
 * It needs to be implemented based on how your flowchart library/drawing logic works.
 * For example, it might call `myFlowchartLibrary.clear()` or `myFlowchartLibrary.loadData({ nodes: [], edges: [] })`.
 */
function clearFlowchartCanvas() {
  console.warn('clearFlowchartCanvas() is a placeholder. IMPLEMENT WITH YOUR FLOWCHART LIBRARY.');
  console.log('Clearing flowchart canvas.');
  const canvas = document.getElementById('flowchart-canvas');
  if (canvas) {
    // Demo implementation: Clear the text content and show a message.
    // Replace this with your actual flowchart clearing mechanism.
    canvas.textContent = 'Canvas Cleared - Start a new flowchart for this exercise!';
  } else {
    console.error('Flowchart canvas element not found for clearing.');
  }
}

// Example of how these might be used (will be integrated into navigation logic later)
// function handleSwitchExercise(oldExerciseId, newExerciseId) {
//   // 1. Save current flowchart before switching (if there was an old exercise)
//   if (oldExerciseId) {
//     const currentData = getCurrentFlowchartData(); // You'll need to implement this
//     saveFlowchartState(oldExerciseId, currentData);
//   }
//
//   // 2. Load flowchart for the new exercise
//   const newExerciseData = loadFlowchartState(newExerciseId);
//
//   // 3. Render the loaded flowchart or a clear canvas
//   if (newExerciseData) {
//     renderFlowchart(newExerciseData); // You'll need to implement this
//   } else {
//     clearFlowchartCanvas(); // You'll need to implement this
//   }
// }
