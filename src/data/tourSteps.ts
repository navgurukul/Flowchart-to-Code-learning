// src/data/tourSteps.ts

export interface TourStep {
  id: string;
  title: string;
  text: string;
  attachTo: {
    element: string; // CSS selector for the element
    on: 'bottom' | 'top' | 'left' | 'right';
  };
  buttons?: Array<{
    text: string;
    action: 'next' | 'back' | 'cancel'; // Shepherd.js specific actions
    classes?: string;
    secondary?: boolean; // For styling back/skip buttons
  }>;
  classes?: string; // Additional classes for the tour step popover
  highlightClass?: string; // Class for highlighting the target element
  when?: { // Conditions for when the step should show (e.g., element exists)
    show?: () => boolean;
    hide?: () => boolean;
  };
}

// Placeholder selectors - these will need to be verified and updated
// based on the actual DOM structure of the application.
// I'll use attribute selectors or more specific class combinations where possible.

const tourStepsConfig: TourStep[] = [
  {
    id: 'connect-nodes',
    title: 'Connect Nodes',
    text: 'Click and drag from connection points (small circles) on nodes to link them. Enable "Sticky Connect" mode to easily chain multiple nodes.',
    attachTo: {
      element: '[data-tour-id="connect-nodes-button"]', // Example: Needs verification - Could be a button or a panel section.
      on: 'bottom',
    },
    classes: 'shepherd-step-custom',
    highlightClass: 'shepherd-highlight',
  },
  {
    id: 'generate-code',
    title: 'Generate Code',
    text: 'Once your flowchart is ready, click here to automatically convert your visual logic into Python code.',
    attachTo: {
      element: '[data-tour-id="generate-code-button"]', // Example: Needs verification
      on: 'bottom',
    },
    classes: 'shepherd-step-custom',
    highlightClass: 'shepherd-highlight',
  },
  {
    id: 'run-code',
    title: 'Run Code',
    text: 'Execute the generated code. The results, including any output or errors, will appear in the Input/Output panel.',
    attachTo: {
      element: '[data-tour-id="run-code-button"]', // Example: Needs verification
      on: 'bottom',
    },
    classes: 'shepherd-step-custom',
    highlightClass: 'shepherd-highlight',
  },
  {
    id: 'zoom-controls',
    title: 'Zoom Controls',
    text: 'Use these controls to zoom in and out, helping you navigate large or complex flowcharts easily.',
    attachTo: {
      element: '[data-tour-id="zoom-controls-container"]', // Example: Needs verification - This might be a div containing zoom buttons.
      on: 'left',
    },
    classes: 'shepherd-step-custom',
    highlightClass: 'shepherd-highlight',
    // This step should only appear if zoom controls are actually present in the UI.
    // when: {
    //   show: () => !!document.querySelector('[data-tour-id="zoom-controls-container"]'),
    // },
  },
  {
    id: 'show-code-editor',
    title: 'Show/Hide Code Editor',
    text: 'Toggle this to view or hide the code editor. You can inspect the generated code or even make minor edits (if enabled).',
    attachTo: {
      element: '[data-tour-id="toggle-code-editor-button"]', // Example: Needs verification
      on: 'bottom',
    },
    classes: 'shepherd-step-custom',
    highlightClass: 'shepherd-highlight',
  },
  {
    id: 'show-input-output',
    title: 'Show/Hide Input & Output',
    text: 'Toggle this panel to see your code\'s output, test results, and any error messages. Essential for debugging!',
    attachTo: {
      element: '[data-tour-id="toggle-input-output-button"]', // Example: Needs verification - Likely near the right panel toggle.
      on: 'left',
    },
    classes: 'shepherd-step-custom',
    highlightClass: 'shepherd-highlight',
  },
  {
    id: 'finish-tour',
    title: 'You\'re All Set!',
    text: 'Great job! You\'ve learned the basics. We recommend starting with Exercise 1 to practice your new skills. Good luck!',
    attachTo: {
      // This step might not attach to a specific element, or it could attach to the exercise list.
      // For now, let's assume it's a general message, possibly centered.
      // If Shepherd.js requires an element, we might need a dummy invisible element or attach to the body/app root.
      element: '[data-tour-id="exercise-list-panel"]', // Example: Attaching to the exercise list as a final prompt. Needs verification.
      on: 'top',
    },
    classes: 'shepherd-step-custom shepherd-step-final', // Custom class for potentially different styling
    highlightClass: 'shepherd-highlight',
    buttons: [ // Shepherd.js typically adds Next/Back. This is for custom buttons like "Finish".
      {
        text: 'Finish Tour',
        action: 'cancel', // 'cancel' usually closes the tour
        classes: 'shepherd-button-primary',
      },
    ],
  },
];

export const getTourSteps = (): TourStep[] => {
  // Here you could add logic to conditionally include steps
  // For example, if zoom controls are not yet implemented, filter out that step.
  return tourStepsConfig.filter(step => {
    if (step.id === 'zoom-controls') {
      // Placeholder: return false; // until zoom controls are confirmed to exist
      // For now, assume they will exist for the tour definition.
      // We will need a robust way to check if the element for a step exists before showing it.
      // Shepherd.js itself might handle missing elements gracefully, but conditional inclusion is cleaner.
    }
    return true;
  });
};

// It's also good practice to define default options for the tour itself.
export const defaultTourOptions = {
  useModalOverlay: true, // Dims the background
  defaultStepOptions: {
    cancelIcon: {
      enabled: true,
      label: 'Skip tour',
    },
    classes: 'shepherd-popup-custom', // A general class for all popups
    scrollTo: { behavior: 'smooth', block: 'center' } as ScrollIntoViewOptions,
    // buttons configuration will be handled per step if custom text/actions are needed,
    // otherwise Shepherd.js provides default Next/Back.
    // We need to ensure "Skip Tour" is available on each step, typically via cancelIcon or a button.
  },
};

// We will also need to define some CSS for 'shepherd-step-custom',
// 'shepherd-highlight', 'shepherd-popup-custom', etc., to match the app's theme.
// For example, in `index.css` or a dedicated tour CSS file:
/*
.shepherd-popup-custom {
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 15px;
  max-width: 350px;
}

.shepherd-step-custom .shepherd-header {
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.shepherd-step-custom .shepherd-title {
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
}

.shepherd-step-custom .shepherd-text {
  font-size: 0.95em;
  color: #555;
  margin-top: 10px;
  margin-bottom: 10px;
  line-height: 1.5;
}

.shepherd-step-custom .shepherd-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.shepherd-step-custom .shepherd-button {
  padding: 8px 15px;
  border-radius: 5px;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
}

.shepherd-step-custom .shepherd-button-primary {
  background-color: #007bff;
  color: white;
}
.shepherd-step-custom .shepherd-button-secondary {
  background-color: #6c757d;
  color: white;
}
.shepherd-step-custom .shepherd-button:not(:last-child) {
  margin-right: 8px;
}

.shepherd-highlight {
  border: 3px dashed #007bff;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5); // This creates the overlay effect for the highlighted element
  border-radius: 4px; // Optional: if highlighted elements should have rounded borders
}

// Step indicator styling
.shepherd-step-custom .shepherd-footer .shepherd-step-indicator {
  font-size: 0.9em;
  color: #666;
}
*/
