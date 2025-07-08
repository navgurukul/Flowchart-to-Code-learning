// src/components/InteractiveTour.tsx
import React, { useEffect, useCallback, useContext } from 'react';
import Shepherd from 'shepherd.js';
import { getTourSteps, defaultTourOptions, TourStep } from '../data/tourSteps'; // Assuming tourSteps.ts is in ../data/

// Optional: If you need to access app-wide state or context, import it here
// import { AppContext } from '../contexts/AppContext'; // Example

const TOUR_STORAGE_KEY = 'interactiveTourCompleted';

interface InteractiveTourProps {
  // Props to control the tour, e.g., forcing a start
  forceStart?: boolean;
  onTourComplete?: () => void;
}

const InteractiveTour: React.FC<InteractiveTourProps> = ({ forceStart, onTourComplete }) => {
  // const appContext = useContext(AppContext); // Example: Accessing context

  const initializeAndStartTour = useCallback(() => {
    const tour = new Shepherd.Tour(defaultTourOptions);

    const tourSteps = getTourSteps(); // Get the dynamic list of steps

    // Function to add steps and handle missing elements gracefully
    const addStepsToTour = (currentSteps: TourStep[]) => {
      currentSteps.forEach((stepConfig, index) => {
        // Basic check if element exists, Shepherd might also handle this
        // but good for conditional steps or debugging.
        // if (stepConfig.attachTo.element && !document.querySelector(stepConfig.attachTo.element)) {
        //   console.warn(`Shepherd step "${stepConfig.id}": Target element "${stepConfig.attachTo.element}" not found. Skipping step.`);
        //   return; // Skip adding this step if its target element doesn't exist
        // }

        tour.addStep({
          id: stepConfig.id,
          title: stepConfig.title,
          text: () => {
            // Create a container for text and step indicator
            const textContainer = document.createElement('div');
            const textElement = document.createElement('p');
            textElement.innerText = stepConfig.text;
            textContainer.appendChild(textElement);

            // Add step indicator: "Step X of Y"
            const indicator = document.createElement('div');
            indicator.innerText = `Step ${index + 1} of ${currentSteps.length}`;
            indicator.style.fontSize = '0.85em';
            indicator.style.marginTop = '10px';
            indicator.style.color = '#666';
            indicator.style.textAlign = 'right'; // Align to the right
            textContainer.appendChild(indicator);

            return textContainer;
          },
          attachTo: stepConfig.attachTo,
          buttons: stepConfig.buttons ?
            stepConfig.buttons.map(btn => ({
              text: btn.text,
              action: tour[btn.action as keyof Shepherd.Tour], // Map string to tour method
              classes: btn.classes,
              secondary: btn.secondary,
            }))
            : [ // Default buttons if not specified
              {
                text: 'Back',
                action: tour.back,
                secondary: true,
                classes: 'shepherd-button-secondary',
              },
              {
                text: 'Next',
                action: tour.next,
                classes: 'shepherd-button-primary',
              }
            ],
          classes: stepConfig.classes,
          highlightClass: stepConfig.highlightClass,
          when: stepConfig.when,
          // Add step indicator to footer or text if not using default buttons
        });
      });
    };

    addStepsToTour(tourSteps);

    // --- Event Logging for Debugging Issue #106 ---
    const logStepDetails = (step: Shepherd.Step, eventName: string) => {
      if (step.id === 'connect-nodes') {
        const element = step.el;
        console.log(`[Tour Debug] Event: '${eventName}' for step '${step.id}'`);
        if (element) {
          console.log(`  Element Exists. Classes: ${element.className}`);
          console.log(`  Computed Style - Display: ${getComputedStyle(element).display}, Opacity: ${getComputedStyle(element).opacity}, Visibility: ${getComputedStyle(element).visibility}`);
          // Check if target is still valid (Shepherd might have internal ways, this is a guess)
          const targetElement = step.options.attachTo && typeof step.options.attachTo.element === 'string' ? document.querySelector(step.options.attachTo.element) : null;
          console.log(`  Target Element ('${step.options.attachTo?.element}') Found: ${!!targetElement}`);
          console.log(`  Is Centered: ${element.classList.contains('shepherd-centered')}`);
        } else {
          console.log(`  Element (step.el) does NOT exist.`);
        }
      }
    };

    // --- State for tracking previous step, to apply fix for issue #106 ---
    let previousActiveStepId: string | null = null;

    tour.on('before-show', ({ step }) => {
      logStepDetails(step, 'before-show'); // Existing log

      // GitHub Issue #106 Fix: If 'connect-nodes' was the previous step, ensure it's truly hidden.
      if (previousActiveStepId === 'connect-nodes') {
        const connectNodesElement = document.getElementById('connect-nodes'); // Shepherd uses step.id as DOM id
        if (connectNodesElement) {
          const isStillProblematic =
            connectNodesElement.classList.contains('shepherd-enabled') ||
            getComputedStyle(connectNodesElement).display !== 'none';

          if (isStillProblematic) {
            console.warn(`[Tour Fix #106] 'connect-nodes' (previous step) found problematic before step '${step.id}' shows. Forcibly hiding.`);
            connectNodesElement.classList.remove('shepherd-enabled');
            connectNodesElement.style.display = 'none';
            connectNodesElement.style.opacity = '0';
            connectNodesElement.style.visibility = 'hidden';

            // Also try Shepherd's API if instance is available and seems open
            const connectNodesStepInstance = tour.getById('connect-nodes');
            if (connectNodesStepInstance && typeof connectNodesStepInstance.isOpen === 'function' && connectNodesStepInstance.isOpen()) {
                console.warn("[Tour Fix #106] Shepherd API reports 'connect-nodes' as open. Calling hide().");
                connectNodesStepInstance.hide();
            }
          }
        }
      }
    });

    tour.on('show', ({ step }) => {
      logStepDetails(step, 'show');
      previousActiveStepId = step.id; // Update after the current step is shown
    });

    tour.on('hide', ({ step }) => {
      logStepDetails(step, 'hide');
      if (step.id === 'connect-nodes') {
        // Existing log to check its state after its own 'hide' event
        setTimeout(() => {
          const el = document.getElementById('connect-nodes');
          if (el) {
            console.log(`[Tour Debug] AFTER HIDE (connect-nodes) - Element Classes: ${el.className}`);
            console.log(`  Computed Style - Display: ${getComputedStyle(el).display}, Opacity: ${getComputedStyle(el).opacity}, Visibility: ${getComputedStyle(el).visibility}`);
          }
        }, 100);
      }
      // If the hidden step was the one tracked, clear previousActiveStepId,
      // though 'show' event of the next step will overwrite it anyway.
      // if (previousActiveStepId === step.id) {
      //   previousActiveStepId = null;
      // }
    });

    tour.on('before-hide', ({ step }) => {
      logStepDetails(step, 'before-hide');
    });
    // --- End Event Logging & Fix ---

    tour.on('complete', () => {
      console.log('[Tour Debug] Event: complete');
      previousActiveStepId = null; // Clear on tour completion
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      if (onTourComplete) onTourComplete();
    });

    tour.on('cancel', () => {
      console.log('[Tour Debug] Event: cancel');
      previousActiveStepId = null; // Clear on tour cancellation
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      if (onTourComplete) onTourComplete();
    });

    // Start the tour
    console.log('[Tour Debug] Starting tour...');
    tour.start();

    // Store the tour instance if you need to access it outside, e.g., for a replay button
    // This might be better managed in a context or Zustand store if accessed globally
    (window as any).currentShepherdTour = tour;

  }, [onTourComplete]);

  useEffect(() => {
    const hasTourBeenCompleted = localStorage.getItem(TOUR_STORAGE_KEY);

    if (forceStart) {
      // If explicitly forced, remove completion flag and start
      localStorage.removeItem(TOUR_STORAGE_KEY);
      initializeAndStartTour();
    } else if (hasTourBeenCompleted !== 'true') {
      // Start tour automatically if not completed
      // Add a small delay to ensure the UI is fully rendered
      const timer = setTimeout(()_ => {
          // Check again, in case component unmounted or forceStart happened
          if (localStorage.getItem(TOUR_STORAGE_KEY) !== 'true') {
            initializeAndStartTour();
          }
      }, 500); // 500ms delay, adjust as needed
      return () => clearTimeout(timer);
    }
  }, [forceStart, initializeAndStartTour]);

  // This component doesn't render anything itself, it just manages the tour.

  // Listen for global event to replay tour (alternative to prop drilling if needed elsewhere)
  useEffect(() => {
    const handleReplayRequest = () => {
      // This check ensures that if forceStart is already true (e.g. from App state),
      // we don't unnecessarily try to start it again through this event listener
      // if the timing is tricky. The forceStart prop is the more direct control.
      if (!forceStart) {
        console.log("Replay tour requested via event.");
        localStorage.removeItem(TOUR_STORAGE_KEY);
        initializeAndStartTour();
      }
    };
    window.addEventListener('replayTourRequested', handleReplayRequest);
    return () => {
      window.removeEventListener('replayTourRequested', handleReplayRequest);
    };
  }, [initializeAndStartTour, forceStart]); // Add forceStart to dependencies

  return null;
};

// Function to be called by a "Replay Tour" button
export const replayInteractiveTour = () => {
  // Primary action is to clear storage. App.tsx will handle starting via forceStart prop.
  localStorage.removeItem(TOUR_STORAGE_KEY);

  // Dispatch event as a secondary mechanism, InteractiveTour itself listens to it.
  // This can be useful if the component isn't re-rendered immediately by App.tsx's state change
  // or for other listeners.
  window.dispatchEvent(new CustomEvent('replayTourRequested'));
};


export default InteractiveTour;
