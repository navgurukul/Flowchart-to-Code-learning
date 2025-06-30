// src/engine/grading.js

import { FlowchartSimulator } from './simulator.js'; // Assuming simulator.js is in the same directory or accessible

/**
 * @typedef {Object} TestCase
 * @property {Object} inputs - Key-value pairs for input blocks. Keys are variable names defined in Input blocks.
 *                             Example: { "A": 10, "B": 5 }
 * @property {Object} expectedOutputs - Key-value pairs for expected final variable states or specific output messages.
 *                                   Example: { "variables": { "result": 25 }, "outputs": ["Final result is 25"] }
 *                                   'variables' checks final state of specified variables.
 *                                   'outputs' checks against an array of messages collected from Output blocks.
 */

/**
 * @typedef {Object} GradingResult
 * @property {boolean} success - True if all test cases pass, false otherwise.
 * @property {Array<TestCaseResult>} testCaseResults - Array of results for each test case.
 */

/**
 * @typedef {Object} TestCaseResult
 * @property {TestCase} testCase - The original test case.
 * @property {boolean} passed - True if this specific test case passed.
 * @property {string} message - A summary message (e.g., "Passed", "Failed: Variable 'x' mismatch").
 * @property {Object} actual - The actual results obtained from the simulation for this test case.
 *                             Example: { "variables": { "result": 20 }, "outputs": ["Final result is 20"] }
 * @property {Array<string>} diff - Array of strings describing discrepancies.
 */


/**
 * Auto-grades a flowchart against a set of test cases.
 *
 * @param {object} flowchartData - The flowchart definition.
 * @param {Array<TestCase>} testCases - An array of test cases to run.
 * @param {object} [uiHooksOverride] - Optional UI hooks to suppress or alter UI interactions during grading.
 *                                     Example: { requestInput: async (varName, prompt) => providedInputs[varName] }
 * @returns {Promise<GradingResult>} - A promise that resolves to a GradingResult object.
 */
export async function autoGradeFlowchart(flowchartData, testCases, uiHooksOverride = {}) {
  const overallResult = {
    success: true,
    testCaseResults: [],
  };

  for (const testCase of testCases) {
    const collectedOutputs = [];
    const currentTestCaseResult = {
      testCase,
      passed: false,
      message: "",
      actual: { variables: {}, outputs: [] },
      diff: [],
    };

    // Prepare UI hooks for this specific test case run
    const gradingUiHooks = {
      // Default hooks that suppress most UI, can be overridden by uiHooksOverride
      refreshFlowchart: () => {},
      highlightBlock: () => {},
      markBlockAsExecuted: () => {},
      updateVariablePanel: () => {},
      showError: (message) => { // Capture errors as failures
        console.error("Grading sim error:", message);
        currentTestCaseResult.diff.push(`Simulation error: ${message}`);
      },
      showOutput: (message) => { // Collect output messages
        collectedOutputs.push(message);
      },
      // Critical: Override requestInput to use testCase.inputs
      requestInput: async (promptTextOrVarName) => {
        // Attempt to find the variableName associated with the prompt or use promptTextOrVarName if it's a direct key
        // This part might need refinement based on how simulator calls requestInput (e.g. if it passes variableName)
        let varKey = "";
        // A simple heuristic: if promptTextOrVarName is a key in inputs, use it.
        if (testCase.inputs.hasOwnProperty(promptTextOrVarName)) {
            varKey = promptTextOrVarName;
        } else {
            // Try to extract variable name if promptText is like "Enter value for X:"
            const match = (promptTextOrVarName || "").match(/for\s+(\w+):?$/i);
            if (match && testCase.inputs.hasOwnProperty(match[1])) {
                varKey = match[1];
            } else {
                 // Fallback: find the first input variable that hasn't been "used" yet (simplistic)
                 // This needs a more robust way to map prompts to input variable names if not direct.
                 // For now, we assume the simulator.js `uiRequestInput` call will pass the `variableName`
                 // from the input block, so `promptTextOrVarName` *is* the variable name.
                 varKey = promptTextOrVarName;
            }
        }

        if (testCase.inputs.hasOwnProperty(varKey)) {
          return testCase.inputs[varKey];
        }
        const errorMessage = `Input for "${varKey}" not found in test case inputs. Prompt was: "${promptTextOrVarName}"`;
        currentTestCaseResult.diff.push(errorMessage);
        throw new Error(errorMessage); // Fail fast for this test case
      },
      ...uiHooksOverride, // Allow specific overrides for testing/debugging grading itself
    };

    const simulator = new FlowchartSimulator(flowchartData, gradingUiHooks);

    try {
      // Run the simulation to completion
      while (!simulator.isFinished) {
        const canStep = await simulator.step();
        if (!canStep && !simulator.isFinished) { // Step failed or ended prematurely
          if (currentTestCaseResult.diff.length === 0) { // If no specific error was pushed by showError hook
             currentTestCaseResult.diff.push("Simulation ended prematurely or failed to step.");
          }
          break;
        }
        if (currentTestCaseResult.diff.some(d => d.startsWith("Simulation error:"))) break; // Stop if error hook caught something
      }

      currentTestCaseResult.actual.variables = { ...simulator.variables };
      currentTestCaseResult.actual.outputs = [...collectedOutputs];

      // Compare results if no simulation errors occurred during the run
      if (!currentTestCaseResult.diff.some(d => d.startsWith("Simulation error:"))) {
        // 1. Compare final variable states
        if (testCase.expectedOutputs.variables) {
          for (const varName in testCase.expectedOutputs.variables) {
            const expectedValue = testCase.expectedOutputs.variables[varName];
            const actualValue = simulator.variables[varName];
            // Using JSON.stringify for simple deep comparison of primitive-like values
            if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
              currentTestCaseResult.diff.push(
                `Variable "${varName}": Expected ${JSON.stringify(expectedValue)}, Got ${JSON.stringify(actualValue)}`
              );
            }
          }
        }

        // 2. Compare collected outputs (if expected)
        if (testCase.expectedOutputs.outputs && Array.isArray(testCase.expectedOutputs.outputs)) {
          if (collectedOutputs.length !== testCase.expectedOutputs.outputs.length) {
            currentTestCaseResult.diff.push(
              `Output count mismatch: Expected ${testCase.expectedOutputs.outputs.length} lines, Got ${collectedOutputs.length} lines.`
            );
          } else {
            for (let i = 0; i < testCase.expectedOutputs.outputs.length; i++) {
              if (collectedOutputs[i] !== testCase.expectedOutputs.outputs[i]) {
                currentTestCaseResult.diff.push(
                  `Output line ${i + 1}: Expected "${testCase.expectedOutputs.outputs[i]}", Got "${collectedOutputs[i]}"`
                );
              }
            }
          }
        }
      } // end if no simulation errors

    } catch (e) {
      // Catch errors from simulator instantiation or unhandled step errors
      console.error("Error during grading simulation:", e);
      if (currentTestCaseResult.diff.length === 0) {
        currentTestCaseResult.diff.push(`Critical simulation error: ${e.message}`);
      }
    }

    currentTestCaseResult.passed = currentTestCaseResult.diff.length === 0;
    if (currentTestCaseResult.passed) {
      currentTestCaseResult.message = "Passed";
    } else {
      currentTestCaseResult.message = `Failed: ${currentTestCaseResult.diff.join('; ')}`;
      overallResult.success = false; // If any test case fails, the overall result is failure
    }
    overallResult.testCaseResults.push(currentTestCaseResult);
  } // end for each testCase

  return overallResult;
}


// Example Usage (Conceptual - requires FlowchartSimulator and a flowchart definition)
/*
async function runGradingExample() {
  const sampleFlowchart = {
    startBlockId: "start1",
    blocks: [
      { id: "start1", type: "Start", nextBlock: "input_A" },
      { id: "input_A", type: "Input", promptText: "A", variableName: "A", nextBlock: "input_B" },
      { id: "input_B", type: "Input", promptText: "B", variableName: "B", nextBlock: "process_sum" },
      { id: "process_sum", type: "Process", operation: "sum = A + B", nextBlock: "output_res" },
      { id: "output_res", type: "Output", message: "The sum is {sum}", nextBlock: "end1" },
      { id: "end1", type: "End" }
    ]
  };

  const testCases = [
    {
      inputs: { "A": 5, "B": 10 }, // Simulator's uiRequestInput should map "A" to variable A
      expectedOutputs: {
        variables: { "sum": 15 },
        outputs: ["The sum is 15"]
      }
    },
    {
      inputs: { "A": -5, "B": 5 },
      expectedOutputs: {
        variables: { "sum": 0 },
        outputs: ["The sum is 0"]
      }
    },
    { // Test case designed to fail (variable name)
      inputs: { "A": 1, "B": 2 },
      expectedOutputs: {
        variables: { "total": 3 }, // Incorrect variable name 'total' vs 'sum'
        outputs: ["The sum is 3"]
      }
    },
    { // Test case designed to fail (output message)
      inputs: { "A": 7, "B": 8 },
      expectedOutputs: {
        variables: { "sum": 15 },
        outputs: ["Sum: 15"] // Incorrect output message format
      }
    }
  ];

  console.log("--- Running Auto-Grading ---");
  const gradingResult = await autoGradeFlowchart(sampleFlowchart, testCases);

  console.log("\n--- Grading Summary ---");
  console.log("Overall Success:", gradingResult.success);
  gradingResult.testCaseResults.forEach((tcResult, index) => {
    console.log(`\nTest Case ${index + 1}: ${tcResult.passed ? 'PASSED' : 'FAILED'}`);
    if (!tcResult.passed) {
      console.log("  Message:", tcResult.message);
      console.log("  Differences:", tcResult.diff);
    }
    // console.log("  Actual outputs:", tcResult.actual); // For debugging
  });
}

// if (require.main === module) { // Node.js direct execution
//   runGradingExample().catch(console.error);
// }
*/
