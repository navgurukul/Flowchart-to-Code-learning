import { evaluateExpression } from './evaluator.js';

// Placeholder for UI interaction functions.
// In a real app, these would be methods on UI controller objects or similar.
// For now, we'll assume these functions are globally available or passed in.
let uiRefreshFlowchart = () => console.warn("uiRefreshFlowchart not implemented");
let uiHighlightBlock = (blockId) => console.warn(`uiHighlightBlock not implemented for ${blockId}`);
let uiMarkBlockAsExecuted = (blockId) => console.warn(`uiMarkBlockAsExecuted not implemented for ${blockId}`);
let uiUpdateVariablePanel = (variables) => console.warn("uiUpdateVariablePanel not implemented with", variables);
let uiShowError = (message) => console.error("SIM_ERROR:", message); // Basic error display
let uiShowOutput = (message) => console.log("SIM_OUTPUT:", message); // Basic output display
let uiRequestInput = async (promptText) => {
  console.warn(`uiRequestInput not implemented for "${promptText}"`);
  return prompt(promptText); // Fallback to browser prompt
};


export class FlowchartSimulator {
  constructor(flowchartData, uiHooks = {}) {
    this.flowchartData = flowchartData; // { startBlockId: "id", blocks: [...] }
    this.variables = {};
    this.executionPath = [];
    this.currentBlockId = null;
    this.isRunning = false;
    this.isFinished = false;
    this.simulationStepDelay = 500; // ms, for auto run

    // Connect UI hooks
    if (uiHooks.refreshFlowchart) uiRefreshFlowchart = uiHooks.refreshFlowchart;
    if (uiHooks.highlightBlock) uiHighlightBlock = uiHooks.highlightBlock;
    if (uiHooks.markBlockAsExecuted) uiMarkBlockAsExecuted = uiHooks.markBlockAsExecuted;
    if (uiHooks.updateVariablePanel) uiUpdateVariablePanel = uiHooks.updateVariablePanel;
    if (uiHooks.showError) uiShowError = uiHooks.showError;
    if (uiHooks.showOutput) uiShowOutput = uiHooks.showOutput;
    if (uiHooks.requestInput) uiRequestInput = uiHooks.requestInput;

    this.reset();
  }

  reset() {
    this.variables = {};
    this.executionPath = [];
    this.currentBlockId = this.flowchartData ? this.flowchartData.startBlockId : null;
    this.isRunning = false;
    this.isFinished = false;

    uiUpdateVariablePanel(this.variables);
    // uiRefreshFlowchart(); // Potentially call this to reset visual state of flowchart
    console.log("Simulator: Reset complete. Current block:", this.currentBlockId);
  }

  _getBlockById(blockId) {
    if (!this.flowchartData || !this.flowchartData.blocks) {
      throw new Error("Flowchart data or blocks are not loaded.");
    }
    const block = this.flowchartData.blocks.find(b => b.id === blockId);
    if (!block) {
      throw new Error(`Block with ID "${blockId}" not found.`);
    }
    return block;
  }

  async step() {
    if (this.isFinished || !this.currentBlockId) {
      this.isRunning = false;
      if (!this.isFinished) {
         uiShowError("Simulation cannot proceed: No current block or already finished.");
      }
      return false; // Indicate simulation cannot step further
    }

    try {
      const currentBlock = this._getBlockById(this.currentBlockId);

      // Highlight current block BEFORE execution
      uiHighlightBlock(this.currentBlockId);
      // Add to execution path BEFORE execution (or just after start of processing)
      if (!this.executionPath.includes(this.currentBlockId) || currentBlock.type === "Process" || currentBlock.type === "Input") {
        // For simplicity, let's always add, or add if it's not the same as last (loops)
        // A more sophisticated path might only add if it's a *new* step in a sequence.
        // For now, just adding it. If it's a loop, it will appear multiple times.
      }
      // The task asks to mark executed blocks in green. This implies a persistent state.
      // We'll call markAsExecuted which should apply a lasting style.
      // The highlighting is for the *current* step.
      uiMarkBlockAsExecuted(this.currentBlockId);
      this.executionPath.push(this.currentBlockId); // Record after marking/highlighting

      let nextBlockId = null;

      console.log(`Executing [${currentBlock.type}] Block ID: ${this.currentBlockId}, Label: ${currentBlock.label || 'N/A'}`);

      switch (currentBlock.type) {
        case 'Start':
          nextBlockId = currentBlock.nextBlock;
          break;
        case 'End':
          this.isFinished = true;
          this.isRunning = false;
          uiShowOutput("Simulation ended.");
          break;
        case 'Process':
          // Operation: "variableName = expression"
          const parts = currentBlock.operation.split('=');
          if (parts.length < 2) throw new Error(`Invalid operation format in Process block "${currentBlock.id}": ${currentBlock.operation}`);
          const targetVariable = parts[0].trim();
          const expressionStr = parts.slice(1).join('=').trim();

          if (!targetVariable) throw new Error(`No target variable in Process block "${currentBlock.id}"`);
          if (!expressionStr) throw new Error(`No expression in Process block "${currentBlock.id}"`);

          this.variables[targetVariable] = evaluateExpression(expressionStr, this.variables);
          uiUpdateVariablePanel(this.variables);
          nextBlockId = currentBlock.nextBlock;
          break;
        case 'Input':
          const variableName = currentBlock.variableName;
          if (!variableName) throw new Error(`No variableName defined for Input block "${currentBlock.id}"`);

          this.isRunning = false; // Pause auto-run for input
          const userInput = await uiRequestInput(currentBlock.promptText || `Enter value for ${variableName}:`);

          // Attempt to convert to number if it looks like one, else keep as string
          if (userInput !== null && userInput.trim() !== "" && !isNaN(Number(userInput))) {
            this.variables[variableName] = parseFloat(userInput);
          } else {
            this.variables[variableName] = userInput; // Store as string (or null if prompt was cancelled)
          }
          uiUpdateVariablePanel(this.variables);
          nextBlockId = currentBlock.nextBlock;
          // If was auto-running, user might need to click "run" again or we can auto-resume
          break;
        case 'Output':
          let message = currentBlock.message || "";
          // Substitute variables: {varName}
          message = message.replace(/\{(.+?)\}/g, (match, varName) => {
            return this.variables.hasOwnProperty(varName.trim()) ? this.variables[varName.trim()] : match;
          });
          uiShowOutput(message);
          nextBlockId = currentBlock.nextBlock;
          break;
        case 'Decision':
          if (!currentBlock.condition) throw new Error(`No condition in Decision block "${currentBlock.id}"`);

          const conditionResult = evaluateExpression(currentBlock.condition, this.variables);
          if (typeof conditionResult !== 'boolean') {
            uiShowError(`Decision block "${currentBlock.id}" condition did not evaluate to a boolean. Got: ${conditionResult}`);
            // Defaulting to false path on ambiguous result, or could halt.
            nextBlockId = currentBlock.falseBlock;
          } else {
            nextBlockId = conditionResult ? currentBlock.trueBlock : currentBlock.falseBlock;
          }
          if (!nextBlockId) throw new Error(`Decision block "${currentBlock.id}" resulted in no valid next path (true/falseBlock missing for result ${conditionResult}).`);
          break;
        default:
          throw new Error(`Unknown block type: ${currentBlock.type}`);
      }

      this.currentBlockId = nextBlockId;
      if (!this.currentBlockId && !this.isFinished) {
          uiShowError(`Execution path ended prematurely after block ${currentBlock.id} - no next block defined.`);
          this.isFinished = true; // Or handle as an error state
      }


    } catch (error) {
      this.isRunning = false;
      this.isFinished = true; // Stop on error
      uiShowError(`Simulation error at block "${this.currentBlockId || 'unknown'}": ${error.message}`);
      console.error(error); // Log full error for dev
      return false; // Indicate error
    }

    if (this.isFinished) {
        uiHighlightBlock(null); // Clear highlight if finished
    }

    return true; // Indicate successful step
  }

  async run() {
    if (this.isRunning || this.isFinished) return;
    this.isRunning = true;

    const runLoop = async () => {
      if (!this.isRunning || this.isFinished) {
        if (this.isFinished) uiHighlightBlock(null); // Clear highlight
        return;
      }

      const success = await this.step();
      if (!success || this.isFinished) {
        this.isRunning = false;
        if (this.isFinished) uiHighlightBlock(null); // Clear highlight
        return;
      }

      // If current block was Input, step() would have set isRunning to false.
      // We need to check that again here before scheduling next step.
      if (!this.isRunning) return;

      setTimeout(runLoop, this.simulationStepDelay);
    };

    runLoop();
  }

  pause() {
    this.isRunning = false;
  }
}

// Example Usage (Conceptual - requires HTML and UI hook implementations)
/*
const sampleFlowchart = {
  startBlockId: "start1",
  blocks: [
    { id: "start1", type: "Start", nextBlock: "input_A", label: "Start" },
    { id: "input_A", type: "Input", promptText: "Enter value for A:", variableName: "A", nextBlock: "process_B", label: "Input A" },
    { id: "process_B", type: "Process", operation: "B = A * 2 + 5", nextBlock: "decision_C", label: "Calc B" },
    { id: "decision_C", type: "Decision", condition: "B > 15", trueBlock: "output_greater", falseBlock: "output_less", label: "B > 15?" },
    { id: "output_greater", type: "Output", message: "B ({B}) is greater than 15.", nextBlock: "end1", label: "Output >" },
    { id: "output_less", type: "Output", message: "B ({B}) is less or equal to 15.", nextBlock: "end1", label: "Output <=" },
    { id: "end1", type: "End", label: "End" }
  ]
};

// Dummy UI Hooks for testing simulator logic directly
const dummyUiHooks = {
  refreshFlowchart: () => console.log("UI: Refresh Flowchart"),
  highlightBlock: (blockId) => console.log(`UI: Highlight Block ${blockId}`),
  markBlockAsExecuted: (blockId) => console.log(`UI: Mark Block ${blockId} as Executed (Green)`),
  updateVariablePanel: (variables) => console.log("UI: Update Variables", variables),
  showError: (message) => console.error("UI ERROR:", message),
  showOutput: (message) => console.log("UI OUTPUT:", message),
  requestInput: async (promptText) => {
    console.log(`UI: Requesting Input - "${promptText}"`);
    // Simulate user input for testing without actual prompt
    if (promptText.includes("A")) return "7"; // Simulate user entering 7 for A
    return "test";
  }
};

async function testSimulator() {
  console.log("--- Testing FlowchartSimulator ---");
  const simulator = new FlowchartSimulator(sampleFlowchart, dummyUiHooks);

  // Manual Stepping
  console.log("\n--- Manual Stepping ---");
  await simulator.step(); // Start
  await simulator.step(); // Input A (provides "7")
  console.log("Variables after input:", simulator.variables);
  await simulator.step(); // Process B = 7 * 2 + 5 = 19
  console.log("Variables after process:", simulator.variables);
  await simulator.step(); // Decision B > 15 (19 > 15 is true)
  await simulator.step(); // Output Greater
  await simulator.step(); // End
  console.log("Execution Path:", simulator.executionPath);
  console.log("Is Finished:", simulator.isFinished);

  // Test Reset and Auto-Run
  console.log("\n--- Reset and Auto-Run ---");
  simulator.reset();
  dummyUiHooks.requestInput = async (promptText) => { // Change input for auto-run
     console.log(`UI: Requesting Input - "${promptText}"`);
     if (promptText.includes("A")) return "3"; // B will be 3*2+5 = 11
     return "auto";
  }
  simulator.simulationStepDelay = 100; // Faster for testing run
  simulator.run();
  // Will pause for input, then should continue if run() is called again or step()
  // For a full auto-run after input, the input mechanism or run loop needs adjustment
  // For now, let's assume after input, we might manually step or re-trigger run
  // To make it fully auto, the uiRequestInput should re-trigger run if it was running.
  // Or the run loop should be more resilient to pauses.

  // Let's wait for a bit for the async run to do its thing (partially)
  await new Promise(resolve => setTimeout(resolve, 1000));
  simulator.pause(); // Pause if it hasn't finished
  console.log("Execution Path (after auto-run attempt):", simulator.executionPath);
  console.log("Variables (after auto-run attempt):", simulator.variables);
  console.log("Is Finished (after auto-run attempt):", simulator.isFinished);
}

// To run the test if this file is executed directly (e.g., with Node.js)
// if (require.main === module) { // This check doesn't work directly with ES modules without a bit more setup
//   testSimulator().catch(console.error);
// }
// You would typically run testSimulator() from an HTML file or a dedicated test script.
*/
