// src/ui/components/Onboarding.js

const ONBOARDING_STORAGE_KEY = 'flowchartSimulatorOnboardingStatus'; // "completed", "skipped"

export class Onboarding {
  constructor(appController, targetElement = document.body) {
    this.appController = appController; // Main application controller to trigger actions
    this.targetElement = targetElement; // Where to append modals/tooltips
    this.currentTourStep = 0;
    this.onboardingStatus = localStorage.getItem(ONBOARDING_STORAGE_KEY);

    this.tourSteps = [
      {
        element: null, // Can be null for general modal, or a selector for element-specific tooltip
        title: "Welcome to the Flowchart Simulator!",
        content: "Let's learn how to create and run simple programs using flowcharts. This quick tour will guide you through the basics.",
        isModal: true,
      },
      {
        element: "#addBlockButton", // Example selector for an "Add Block" button
        title: "Add Your First Block",
        content: "Click here to add a new block to your flowchart. You can choose from Start, Process, Decision, Input, Output, or End blocks.",
        placement: "bottom", // For a library like Popper.js or Tippy.js
      },
      {
        element: "#blockPropertiesPanel", // Example selector
        title: "Configure Block Properties",
        content: "Once a block is selected or added, you can define its behavior here, like setting operations for a Process block or conditions for a Decision block.",
        placement: "left",
      },
      {
        element: "#runButton", // Example selector
        title: "Run Your Flowchart",
        content: "After designing your flowchart, click here to run the simulation step-by-step and see your logic in action!",
        placement: "bottom",
      },
      {
        element: null,
        title: "You're All Set!",
        content: "You've learned the basics. Feel free to explore and build more complex flowcharts. Happy coding!",
        isModal: true,
      }
    ];
  }

  needsOnboarding() {
    return !this.onboardingStatus; // Show if status is null (neither completed nor skipped)
  }

  start() {
    if (!this.needsOnboarding()) {
      console.log("Onboarding already completed or skipped.");
      return;
    }
    this.currentTourStep = 0;
    this.showStep(this.currentTourStep);
  }

  showStep(stepIndex) {
    // In a real implementation, this would use a modal/tooltip library or custom DOM elements.
    // For now, we'll simulate with console logs and basic prompts.
    const step = this.tourSteps[stepIndex];
    if (!step) {
      this.completeOnboarding();
      return;
    }

    console.log(`--- Onboarding Step ${stepIndex + 1}: ${step.title} ---`);
    console.log(step.content);

    // Simulate UI display
    this.cleanupPreviousStepUI(); // Remove old tooltips/modals

    if (step.isModal) {
      this.displayModal(step);
    } else {
      this.displayTooltip(step);
    }
  }

  displayModal(step) {
    // This would create and show a modal dialog
    const modalHTML = `
      <div class="onboarding-modal" style="position:fixed; top:20%; left:50%; transform:translate(-50%, -50%); background:white; padding:20px; border:1px solid #ccc; z-index:1000;">
        <h3>${step.title}</h3>
        <p>${step.content}</p>
        <button class="next-step">Next</button>
        <button class="skip-onboarding">Skip Tutorial</button>
      </div>
    `;
    const modalElement = this.htmlToElement(modalHTML);
    this.targetElement.appendChild(modalElement);
    this.currentStepElement = modalElement;

    modalElement.querySelector('.next-step').onclick = () => this.nextStep();
    modalElement.querySelector('.skip-onboarding').onclick = () => this.skipOnboarding();
  }

  displayTooltip(step) {
    // This would create and show a tooltip pointing to step.element
    // For simplicity, we're using a modal-like display for tooltips too
    console.log(`Tooltip for element: ${step.element}, placement: ${step.placement}`);
    // In a real app, you'd use Tippy.js, Popper.js or similar, or custom CSS
    const tooltipHTML = `
      <div class="onboarding-tooltip" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:lightyellow; padding:15px; border:1px solid #ccc; z-index:1000;">
        <h3>${step.title} (tooltip for ${step.element})</h3>
        <p>${step.content}</p>
        <button class="next-step">Next</button>
        <button class="skip-onboarding">Skip Tutorial</button>
      </div>
    `;
    // Ideally, position this tooltip near step.element
    const tooltipElement = this.htmlToElement(tooltipHTML);
    this.targetElement.appendChild(tooltipElement);
    this.currentStepElement = tooltipElement;

    tooltipElement.querySelector('.next-step').onclick = () => this.nextStep();
    tooltipElement.querySelector('.skip-onboarding').onclick = () => this.skipOnboarding();
  }

  cleanupPreviousStepUI() {
    if (this.currentStepElement) {
      this.currentStepElement.remove();
      this.currentStepElement = null;
    }
  }

  nextStep() {
    this.currentTourStep++;
    if (this.currentTourStep < this.tourSteps.length) {
      this.showStep(this.currentTourStep);
    } else {
      this.completeOnboarding();
    }
  }

  completeOnboarding() {
    this.cleanupPreviousStepUI();
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'completed');
    this.onboardingStatus = 'completed';
    console.log("Onboarding completed!");
    if (this.appController && this.appController.onOnboardingComplete) {
      this.appController.onOnboardingComplete();
    }
  }

  skipOnboarding() {
    this.cleanupPreviousStepUI();
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'skipped');
    this.onboardingStatus = 'skipped';
    console.log("Onboarding skipped.");
    if (this.appController && this.appController.onOnboardingSkipped) {
      this.appController.onOnboardingSkipped();
    }
  }

  resetOnboardingStatus() {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      this.onboardingStatus = null;
      console.log("Onboarding status reset. Will show on next load if needed.");
  }

  // Helper to convert HTML string to DOM element
  htmlToElement(html) {
    const template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
  }
}

// Example Usage (Conceptual - requires an AppController and actual UI elements)
/*
// --- In your main application file (e.g., app.js) ---
// class AppController {
//   constructor() {
//     this.onboarding = new Onboarding(this, document.getElementById('app-container'));
//     // ... other initializations
//   }
//
//   init() {
//     if (this.onboarding.needsOnboarding()) {
//       this.onboarding.start();
//     } else {
//       this.loadMainApp();
//     }
//   }
//
//   loadMainApp() {
//     console.log("Loading main application...");
//   }
//
//   onOnboardingComplete() {
//     console.log("AppController: Onboarding finished, loading main app.");
//     this.loadMainApp();
//   }
//
//   onOnboardingSkipped() {
//     console.log("AppController: Onboarding skipped, loading main app.");
//     this.loadMainApp();
//   }
// }
//
// const app = new AppController();
// app.init();
// To test reset: app.onboarding.resetOnboardingStatus(); app.init();
*/
