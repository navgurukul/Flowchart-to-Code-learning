// src/mentor/ChallengeBuilder.js

export class ChallengeBuilder {
  constructor(containerElement, saveChallengeCallback) {
    this.container = containerElement;
    this.saveChallengeCallback = saveChallengeCallback; // Function to call when saving a challenge
    this.challenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      title: "",
      description: "",
      category: "",
      testCases: [], // Array of { inputs: {}, expectedOutputs: { variables:{}, outputs:[] } }
      preloadedFlowchart: null, // Optional: flowchartData JSON object
    };
    this.currentTestCaseIndex = -1; // For editing a specific test case
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <h2>Challenge Builder (Mentor Mode)</h2>
      <form id="challengeForm">
        <div>
          <label for="challengeTitle">Title:</label>
          <input type="text" id="challengeTitle" name="title" required>
        </div>
        <div>
          <label for="challengeDescription">Description:</label>
          <textarea id="challengeDescription" name="description" rows="3" required></textarea>
        </div>
        <div>
          <label for="challengeCategory">Category:</label>
          <input type="text" id="challengeCategory" name="category">
        </div>

        <h3>Test Cases</h3>
        <div id="testCasesContainer">
          <!-- Test cases will be dynamically added here -->
        </div>
        <button type="button" id="addTestCaseButton">Add Test Case</button>

        <div id="testCaseEditor" style="display:none; border:1px solid #eee; padding:10px; margin-top:10px;">
          <h4>Test Case Details</h4>
          <input type="hidden" id="testCaseIndexInput">
          <div>
            <label>Inputs (JSON format - e.g., {"varA": 10, "varB": "hello"}):</label>
            <textarea id="testCaseInputs" rows="3"></textarea>
          </div>
          <div>
            <label>Expected Variables (JSON - e.g., {"result": 100}):</label>
            <textarea id="expectedVariables" rows="3"></textarea>
          </div>
          <div>
            <label>Expected Output Messages (JSON array of strings - e.g., ["Line 1", "Line 2"]):</label>
            <textarea id="expectedOutputMessages" rows="3"></textarea>
          </div>
          <button type="button" id="saveTestCaseButton">Save Test Case</button>
          <button type="button" id="cancelTestCaseButton">Cancel</button>
        </div>

        <h3>Optional: Preloaded Flowchart</h3>
        <div>
          <label for="preloadedFlowchart">Flowchart JSON (leave blank if none):</label>
          <textarea id="preloadedFlowchart" name="preloadedFlowchart" rows="5"></textarea>
        </div>

        <hr>
        <button type="submit">Save Challenge</button>
      </form>
    `;

    this.form = this.container.querySelector("#challengeForm");
    this.testCasesContainer = this.container.querySelector("#testCasesContainer");
    this.testCaseEditor = this.container.querySelector("#testCaseEditor");

    this.form.addEventListener("submit", this.handleSaveChallenge.bind(this));
    this.container.querySelector("#addTestCaseButton").addEventListener("click", this.handleAddTestCase.bind(this));
    this.container.querySelector("#saveTestCaseButton").addEventListener("click", this.handleSaveTestCase.bind(this));
    this.container.querySelector("#cancelTestCaseButton").addEventListener("click", this.handleCancelTestCase.bind(this));

    this.form.elements.title.addEventListener('input', (e) => this.challenge.title = e.target.value);
    this.form.elements.description.addEventListener('input', (e) => this.challenge.description = e.target.value);
    this.form.elements.category.addEventListener('input', (e) => this.challenge.category = e.target.value);
    this.form.elements.preloadedFlowchart.addEventListener('input', this.handlePreloadedFlowchartInput.bind(this));


    this.renderTestCases();
  }

  handlePreloadedFlowchartInput(event) {
    const jsonString = event.target.value;
    if (!jsonString.trim()) {
        this.challenge.preloadedFlowchart = null;
        return;
    }
    try {
        this.challenge.preloadedFlowchart = JSON.parse(jsonString);
        event.target.style.borderColor = ''; // Reset border color on valid JSON
    } catch (e) {
        this.challenge.preloadedFlowchart = null; // Invalid JSON
        event.target.style.borderColor = 'red'; // Indicate error
        console.warn("Invalid JSON for preloaded flowchart:", e.message);
    }
  }

  renderTestCases() {
    this.testCasesContainer.innerHTML = "";
    if (this.challenge.testCases.length === 0) {
      this.testCasesContainer.innerHTML = "<p>No test cases defined yet.</p>";
      return;
    }
    const ul = document.createElement("ul");
    this.challenge.testCases.forEach((tc, index) => {
      const li = document.createElement("li");
      li.textContent = `Test Case ${index + 1}: Inputs: ${JSON.stringify(tc.inputs)}, Expected Vars: ${JSON.stringify(tc.expectedOutputs.variables)}, Expected Outputs: ${JSON.stringify(tc.expectedOutputs.outputs)}`;
      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.type = "button";
      editButton.onclick = () => this.handleEditTestCase(index);
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.type = "button";
      deleteButton.onclick = () => this.handleDeleteTestCase(index);
      li.appendChild(editButton);
      li.appendChild(deleteButton);
      ul.appendChild(li);
    });
    this.testCasesContainer.appendChild(ul);
  }

  handleAddTestCase() {
    this.currentTestCaseIndex = -1; // New test case
    this.testCaseEditor.querySelector("#testCaseIndexInput").value = -1;
    this.testCaseEditor.querySelector("#testCaseInputs").value = "";
    this.testCaseEditor.querySelector("#expectedVariables").value = "";
    this.testCaseEditor.querySelector("#expectedOutputMessages").value = "";
    this.testCaseEditor.style.display = "block";
  }

  handleEditTestCase(index) {
    this.currentTestCaseIndex = index;
    const tc = this.challenge.testCases[index];
    this.testCaseEditor.querySelector("#testCaseIndexInput").value = index;
    this.testCaseEditor.querySelector("#testCaseInputs").value = JSON.stringify(tc.inputs || {}, null, 2);
    this.testCaseEditor.querySelector("#expectedVariables").value = JSON.stringify(tc.expectedOutputs.variables || {}, null, 2);
    this.testCaseEditor.querySelector("#expectedOutputMessages").value = JSON.stringify(tc.expectedOutputs.outputs || [], null, 2);
    this.testCaseEditor.style.display = "block";
  }

  handleDeleteTestCase(index) {
      if (confirm(`Are you sure you want to delete Test Case ${index + 1}?`)) {
          this.challenge.testCases.splice(index, 1);
          this.renderTestCases();
      }
  }

  handleSaveTestCase() {
    const index = parseInt(this.testCaseEditor.querySelector("#testCaseIndexInput").value, 10);
    let inputs, expectedVariables, expectedOutputMessages;

    try {
      inputs = JSON.parse(this.testCaseEditor.querySelector("#testCaseInputs").value || "{}");
      expectedVariables = JSON.parse(this.testCaseEditor.querySelector("#expectedVariables").value || "{}");
      expectedOutputMessages = JSON.parse(this.testCaseEditor.querySelector("#expectedOutputMessages").value || "[]");
      if (!Array.isArray(expectedOutputMessages)) throw new Error("Expected Output Messages must be a JSON array.");
    } catch (e) {
      alert(`Error parsing Test Case JSON: ${e.message}`);
      return;
    }

    const newTestCase = {
      inputs,
      expectedOutputs: {
        variables: expectedVariables,
        outputs: expectedOutputMessages,
      },
    };

    if (index === -1) { // New test case
      this.challenge.testCases.push(newTestCase);
    } else { // Editing existing
      this.challenge.testCases[index] = newTestCase;
    }
    this.renderTestCases();
    this.testCaseEditor.style.display = "none";
  }

  handleCancelTestCase() {
      this.testCaseEditor.style.display = "none";
  }

  handleSaveChallenge(event) {
    event.preventDefault();
    // Basic validation
    if (!this.challenge.title.trim() || !this.challenge.description.trim()) {
      alert("Challenge Title and Description are required.");
      return;
    }
    if (this.challenge.testCases.length === 0) {
      alert("At least one test case is required for the challenge.");
      return;
    }
    // The preloadedFlowchart JSON validity is checked on input

    console.log("Saving challenge:", this.challenge);
    if (this.saveChallengeCallback) {
      this.saveChallengeCallback(this.challenge);
      alert("Challenge saved!"); // Or provide more sophisticated feedback
      // Optionally reset the form or navigate away
      this.resetForm();
    } else {
      console.warn("No saveChallengeCallback provided. Challenge data logged to console.");
      alert("Challenge data prepared (see console). No save function configured.");
    }
  }

  resetForm() {
    this.challenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: "",
      description: "",
      category: "",
      testCases: [],
      preloadedFlowchart: null,
    };
    this.form.reset(); // Resets form fields
    // Manually clear textareas that might not be reset by form.reset() if their value was set programmatically
    this.form.elements.description.value = "";
    this.form.elements.preloadedFlowchart.value = "";
    this.form.elements.preloadedFlowchart.style.borderColor = '';
    this.renderTestCases();
    this.testCaseEditor.style.display = "none";
  }
}

// Example Usage (Conceptual - requires a container element and a save callback)
/*
// --- In your main application file (e.g., app.js or mentor-section.js) ---
//
// function handleSaveChallengeToLocalStorage(challengeData) {
//   try {
//     const challenges = JSON.parse(localStorage.getItem('customChallenges') || '[]');
//     // Check for existing challenge ID if updates are allowed, or just add new
//     const existingIndex = challenges.findIndex(c => c.id === challengeData.id);
//     if (existingIndex > -1) {
//         challenges[existingIndex] = challengeData; // Update existing
//     } else {
//         challenges.push(challengeData); // Add new
//     }
//     localStorage.setItem('customChallenges', JSON.stringify(challenges));
//     console.log("Challenge saved to localStorage:", challengeData);
//   } catch (e) {
//     console.error("Error saving challenge to localStorage:", e);
//     alert("Error saving challenge.");
//   }
// }
//
// const challengeBuilderContainer = document.getElementById('challenge-builder-container');
// if (challengeBuilderContainer) {
//   const builder = new ChallengeBuilder(challengeBuilderContainer, handleSaveChallengeToLocalStorage);
// } else {
//   console.error("Challenge builder container not found.");
// }
*/
