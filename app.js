// app.js

// Assume this variable holds the ID of the currently loaded exercise.
// It might be initialized from a URL parameter, a default value, or other means.
let currentExerciseId = null; // Initially no exercise is loaded

// --- These are your EXISTING functions (or similar) that you need to implement ---
// --- based on your flowchart library. These are also placeholders in flowchartManager.js ---

// You need to implement this function to get the data from your flowchart builder.
// This is just a reference to the one in flowchartManager.js for clarity,
// but the actual implementation must be in your flowchart specific code or flowchartManager.js
// function getCurrentFlowchartData() {
//   console.warn('app.js: getCurrentFlowchartData() needs to be implemented based on your flowchart library.');
//   // Example: return myFlowchartLibrary.getData();
//   return { nodes: [{id: 'temp', content: 'Temporary data for ' + currentExerciseId}], edges: [] };
// }

// You need to implement this function to draw/render the flowchart.
// This is just a reference to the one in flowchartManager.js for clarity.
// function renderFlowchart(flowchartData) {
//   console.warn('app.js: renderFlowchart() needs to be implemented based on your flowchart library.');
//   // Example: myFlowchartLibrary.render(flowchartData);
//   const canvas = document.getElementById('flowchart-canvas');
//   if (canvas) {
//     canvas.textContent = flowchartData ? JSON.stringify(flowchartData, null, 2) : 'New Exercise - Start building!';
//   }
// }

// You need to implement this function to clear the flowchart canvas.
// This is just a reference to the one in flowchartManager.js for clarity.
// function clearFlowchartCanvas() {
//   console.warn('app.js: clearFlowchartCanvas() needs to be implemented based on your flowchart library.');
//   // Example: myFlowchartLibrary.clear();
//   const canvas = document.getElementById('flowchart-canvas');
//   if (canvas) {
//     canvas.textContent = 'Canvas Cleared - Start a new flowchart!';
//   }
// }
// --- End of placeholder functions you need to ensure are correctly implemented ---


/**
 * Handles the logic when switching to a new exercise.
 * @param {string} newExerciseId - The ID of the new exercise to load.
 */
function navigateToExercise(newExerciseId) {
  if (currentExerciseId === newExerciseId) {
    console.log(`Already on exercise ${newExerciseId}`);
    return; // No action needed if it's the same exercise
  }

  console.log(`Navigating from exercise ${currentExerciseId} to ${newExerciseId}`);

  // 1. Save the state of the current flowchart (if one was active)
  if (currentExerciseId !== null) {
    // IMPORTANT: getCurrentFlowchartData() must be implemented to return
    // the actual data from your flowchart component.
    const flowchartDataToSave = getCurrentFlowchartData(); // From flowchartManager.js (needs real implementation)
    if (flowchartDataToSave) {
      saveFlowchartState(currentExerciseId, flowchartDataToSave);
    } else {
      console.warn(`No flowchart data to save for ${currentExerciseId}. It might be empty or getCurrentFlowchartData is not returning data.`);
    }
  }

  // Update the current exercise ID
  const oldExerciseId = currentExerciseId;
  currentExerciseId = newExerciseId;

  // Update UI to reflect the new exercise ID (example)
  const exerciseIdDisplay = document.getElementById('current-exercise-id');
  if (exerciseIdDisplay) {
    exerciseIdDisplay.textContent = currentExerciseId;
  }

  // 2. Load the flowchart state for the new exercise
  const loadedFlowchartData = loadFlowchartState(currentExerciseId); // From flowchartManager.js

  // 3. Render the loaded flowchart or clear the canvas for a new one
  if (loadedFlowchartData) {
    renderFlowchart(loadedFlowchartData); // From flowchartManager.js (needs real implementation)
  } else {
    clearFlowchartCanvas(); // From flowchartManager.js (needs real implementation)
  }

  console.log(`Switched to exercise ${currentExerciseId}. Previous was ${oldExerciseId}.`);
}

// --- Example Usage (for demonstration) ---
// This setup would typically be in your main HTML file or an initialization script.

document.addEventListener('DOMContentLoaded', () => {
  // Initialize with a default exercise, e.g., 'exercise1'
  // In a real app, you might get this from the URL or other state.
  const initialExerciseId = 'exercise1'; // Or determine dynamically
  navigateToExercise(initialExerciseId);

  // Example: Setup navigation buttons (if you have them)
  const navButtons = document.querySelectorAll('.nav-exercise-btn');
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const newId = button.dataset.exerciseId;
      if (newId) {
        navigateToExercise(newId);
      }
    });
  });

  // Example: Simulate a change in the flowchart that would then be saved on navigation
  // This is just for testing. In reality, your flowchart library would manage its data.
  const mockFlowchartCanvas = document.getElementById('flowchart-canvas');
  if (mockFlowchartCanvas && typeof getCurrentFlowchartData === 'function' && getCurrentFlowchartData.toString().includes("console.warn")) {
    // If using the placeholder getCurrentFlowchartData, we can simulate changes
    mockFlowchartCanvas.addEventListener('click', () => {
      // This is a very crude simulation of data changing.
      // Replace this with actual interaction with your flowchart component.
      const currentData = getCurrentFlowchartData(); // This will call the placeholder in flowchartManager.js
      currentData.nodes.push({id: `node${Date.now()}`, content: `Clicked at ${new Date().toLocaleTimeString()}`});
      // Update the placeholder's internal state if it's designed to hold it, or manage it here.
      // For this example, the placeholder getCurrentFlowchartData always returns a fresh object,
      // so to make the simulation work, we'd need to modify flowchartManager.js or manage state here.
      // For simplicity in this step, we assume that calling getCurrentFlowchartData multiple times within
      // the same exercise session (before navigation) would reflect ongoing changes.
      // The crucial part is that *before navigating away*, the *final* state is fetched.
      console.log("Mock canvas clicked, data 'updated' (in placeholder). This would be saved on next navigation.");
      // To make the simulation more visible, we can re-render the placeholder data.
      // In a real app, your flowchart library would handle its own rendering on edits.
      renderFlowchart(currentData);
    });
  }
});

// Ensure the placeholder functions from flowchartManager.js are available
// If they are not defined globally (e.g. if flowchartManager.js uses modules),
// you would need to import them. For simplicity, this example assumes they are global.
// If flowchartManager.js defines these functions, and it's loaded first, they should be available.
// However, it's critical that getCurrentFlowchartData, renderFlowchart, and clearFlowchartCanvas
// are implemented to interact with your *actual* flowchart component.
