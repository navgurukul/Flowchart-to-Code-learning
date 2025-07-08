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

    tour.on('complete', () => {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      if (onTourComplete) onTourComplete();
      // Ensure tour instance is cleaned up if needed, though Shepherd might handle this
    });

    tour.on('cancel', () => {
      // Also mark as seen if skipped, unless we want it to reappear
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      if (onTourComplete) onTourComplete(); // Or a different handler for skip
    });

    // Start the tour
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
