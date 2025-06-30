// src/engine/validator.js

import { validateExpression } from './evaluator.js'; // Assuming evaluator.js is in the same directory

/**
 * Validates a flowchart definition for common errors and structural issues.
 *
 * @param {object} flowchartData The flowchart data object, expected to have:
 *                               - startBlockId: string
 *                               - blocks: Array of block objects
 * @param {object} [options] Optional validation options.
 * @param {boolean} [options.checkExpressions=true] Whether to validate expressions in Process/Decision blocks.
 * @returns {Array<object>} An array of error objects. Each error object has:
 *                          - id: (string, optional) The ID of the block related to the error.
 *                          - message: (string) A user-friendly error message.
 *                          - type: (string) e.g., "Structural", "Logical", "Expression"
 */
export function validateFlowchart(flowchartData, options = { checkExpressions: true }) {
  const errors = [];
  if (!flowchartData) {
    errors.push({ message: "Flowchart data is missing.", type: "Critical" });
    return errors; // Cannot proceed further
  }

  const { startBlockId, blocks } = flowchartData;

  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    errors.push({ message: "Flowchart has no blocks defined.", type: "Structural" });
    return errors; // Cannot do much without blocks
  }

  const blockIds = new Set(blocks.map(b => b.id));
  const blockMap = new Map(blocks.map(b => [b.id, b]));

  // 1. Check for Start block
  if (!startBlockId) {
    errors.push({ message: "No Start block defined for the flowchart.", type: "Structural" });
  } else if (!blockMap.has(startBlockId)) {
    errors.push({ message: `Defined Start block ID "${startBlockId}" does not exist in blocks.`, type: "Structural" });
  } else if (blockMap.get(startBlockId).type !== 'Start') {
    errors.push({ id: startBlockId, message: `Block "${startBlockId}" is set as Start Block but is not of type "Start".`, type: "Structural" });
  }

  const startBlocks = blocks.filter(b => b.type === 'Start');
  if (startBlocks.length === 0 && !blockMap.has(startBlockId)) { // Handles case where startBlockId might be bad but no start types exist either
      errors.push({ message: "The flowchart must contain at least one 'Start' block.", type: "Structural" });
  } else if (startBlocks.length > 1) {
    // This is more of a warning or style issue if startBlockId is correctly pointing to one.
    // For strictness, we can flag it.
    // errors.push({ message: `Multiple 'Start' blocks found (${startBlocks.map(b=>b.id).join(', ')}). Only one should be the entry point via startBlockId.`, type: "Structural" });
  }


  // 2. Check for at least one End block (presence, not reachability yet)
  const endBlocks = blocks.filter(b => b.type === 'End');
  if (endBlocks.length === 0) {
    errors.push({ message: "The flowchart must contain at least one 'End' block.", type: "Structural" });
  }

  // 3. Validate individual blocks and connections
  const reachableBlocks = new Set();
  const knownVariablesFromInputs = {}; // For expression validation context

  if (startBlockId && blockMap.has(startBlockId)) {
    const queue = [startBlockId];
    reachableBlocks.add(startBlockId);

    let head = 0;
    while(head < queue.length) {
      const currentId = queue[head++];
      const block = blockMap.get(currentId);

      if (!block) continue; // Should have been caught by blockMap.has earlier

      // Store variable names from Input blocks for later expression validation
      if (block.type === 'Input' && block.variableName) {
        knownVariablesFromInputs[block.variableName] = null; // Value doesn't matter, just existence
      }
      // Process blocks also define variables, but their RHS might use uninitialized ones
      // A more advanced validator might track variable definition order.
      // For now, we'll assume variables used in expressions should ideally come from Inputs
      // or be assigned in prior Process blocks (harder to check statically without execution order).

      const checkNext = (nextId, pathName = "next") => {
        if (nextId) {
          if (!blockIds.has(nextId)) {
            errors.push({ id: currentId, message: `Block "${currentId}" ${pathName} path points to a non-existent block ID "${nextId}".`, type: "Connectivity" });
          } else if (!reachableBlocks.has(nextId)) {
            reachableBlocks.add(nextId);
            queue.push(nextId);
          }
        } else if (block.type !== 'End') { // Non-End blocks should have a next path (unless Decision)
            if (block.type !== 'Decision') { // Decisions handle their own path checks
                 errors.push({ id: currentId, message: `Block "${currentId}" is missing its "${pathName}" connection.`, type: "Connectivity" });
            }
        }
      };

      switch (block.type) {
        case 'Start':
        case 'Process':
        case 'Input':
        case 'Output':
          checkNext(block.nextBlock);
          if (options.checkExpressions) {
            if (block.type === 'Process' && block.operation) {
                const parts = block.operation.split('=');
                if (parts.length > 1) {
                    const expr = parts.slice(1).join('=').trim();
                    const valResult = validateExpression(expr, knownVariablesFromInputs); // Basic check
                    if (!valResult.isValid) {
                        errors.push({id: currentId, message: `In Process block "${currentId}": ${valResult.message}`, type: "Expression"});
                    }
                    // Add the target variable to knownVariables after this "assignment"
                    const targetVar = parts[0].trim();
                    if(targetVar) knownVariablesFromInputs[targetVar] = null;
                } else {
                     errors.push({id: currentId, message: `Process block "${currentId}" has malformed operation: "${block.operation}". Expected "variable = expression".`, type: "Expression"});
                }
            } else if (block.type === 'Process' && !block.operation) {
                 errors.push({id: currentId, message: `Process block "${currentId}" is missing its operation.`, type: "Expression"});
            }
          }
          break;
        case 'Decision':
          if (!block.trueBlock && !block.falseBlock) {
             errors.push({ id: currentId, message: `Decision block "${currentId}" is missing both True and False path connections.`, type: "Connectivity" });
          } else {
            if (!block.trueBlock) errors.push({ id: currentId, message: `Decision block "${currentId}" is missing its True path connection.`, type: "Connectivity" });
            else checkNext(block.trueBlock, "True");
            if (!block.falseBlock) errors.push({ id: currentId, message: `Decision block "${currentId}" is missing its False path connection.`, type: "Connectivity" });
            else checkNext(block.falseBlock, "False");
          }
          if (options.checkExpressions && block.condition) {
            const valResult = validateExpression(block.condition, knownVariablesFromInputs);
            if (!valResult.isValid) {
                errors.push({id: currentId, message: `In Decision block "${currentId}": ${valResult.message}`, type: "Expression"});
            }
          } else if (options.checkExpressions && !block.condition) {
             errors.push({id: currentId, message: `Decision block "${currentId}" is missing its condition.`, type: "Expression"});
          }
          break;
        case 'End':
          // No outgoing paths to check
          break;
        default:
          errors.push({ id: currentId, message: `Block "${currentId}" has an unknown type: "${block.type}".`, type: "Structural" });
      }
    }
  } else if (blocks.length > 0 && startBlockId) { // startBlockId was defined but not found
    // Error already added
  } else if (blocks.length > 0 && !startBlockId && startBlocks.length === 0) { // No start block ID and no block of type start
    // Error already added
  }


  // 4. Check for unreachable blocks (excluding start block itself if it was invalid)
  blocks.forEach(block => {
    if (!reachableBlocks.has(block.id)) {
      errors.push({ id: block.id, message: `Block "${block.id}" (${block.label || block.type}) is unreachable from the Start block.`, type: "Structural" });
    }
  });

  // 5. Check if all paths eventually lead to an End block (more complex, requires graph cycle detection or path traversal)
  // This is a basic check: ensures that if a path doesn't explicitly end, it's flagged.
  // A full check for "all paths lead to an end" is more involved.
  // For now, we've checked that End blocks exist and that non-End blocks have next pointers.
  // The "unreachable" check also helps.
  // A simple check: are there any reachable non-End blocks that don't point to anything?
  reachableBlocks.forEach(id => {
      const block = blockMap.get(id);
      if (block.type !== 'End' && block.type !== 'Decision') {
          if (!block.nextBlock) {
              // This case should be caught by "missing its next connection" already
          }
      } else if (block.type === 'Decision') {
          if ((!block.trueBlock || !blockMap.has(block.trueBlock)) && (!block.falseBlock || !blockMap.has(block.falseBlock))) {
              // If both paths are missing or point to invalid blocks, it's a dead end.
              // This is partially covered by individual true/false path checks.
          }
      }
  });


  return errors;
}

// Example Usage:
/*
if (require.main === module) { // Node.js direct execution
  const { evaluateExpression, validateExpression: validateExprFn } = require('./evaluator.js'); // Adjust path if needed

  // Mock validateExpression if it's not being directly imported for some reason (it should be)
  // const mockValidateExpression = (expr, vars) => {
  //   if (expr.includes("?")) return { isValid: false, message: "Syntax error due to ?" };
  //   if (expr.includes("undef")) return { isValid: false, message: "Undefined variable 'undef'" };
  //   return { isValid: true, message: "Valid" };
  // };
  // Replace `validateExpression` with `mockValidateExpression` in the validator if needed for isolated test.


  const sampleFlowchart_Valid = {
    startBlockId: "start1",
    blocks: [
      { id: "start1", type: "Start", nextBlock: "input_A", label: "Start" },
      { id: "input_A", type: "Input", promptText: "Enter A:", variableName: "A", nextBlock: "process_B", label: "Input A" },
      { id: "process_B", type: "Process", operation: "B = A * 2", nextBlock: "decision_C", label: "Calc B" },
      { id: "decision_C", type: "Decision", condition: "B > 10", trueBlock: "output_G", falseBlock: "output_L", label: "B > 10?" },
      { id: "output_G", type: "Output", message: "Greater", nextBlock: "end1", label: "Output >" },
      { id: "output_L", type: "Output", message: "Less/Equal", nextBlock: "end1", label: "Output <=" },
      { id: "end1", type: "End", label: "End" }
    ]
  };

  const sampleFlowchart_NoStartId = { ...sampleFlowchart_Valid, startBlockId: null };
  const sampleFlowchart_BadStartId = { ...sampleFlowchart_Valid, startBlockId: "nonexistent_start" };
  const sampleFlowchart_NoEndBlock = {
    startBlockId: "start1",
    blocks: [ { id: "start1", type: "Start", nextBlock: "input_A" } , { id: "input_A", type: "Input", variableName: "A"}] // No End block
  };
  const sampleFlowchart_Unreachable = {
    startBlockId: "start1",
    blocks: [
      { id: "start1", type: "Start", nextBlock: "end1" },
      { id: "unreachable1", type: "Process", operation: "x=1", nextBlock: "end1" },
      { id: "end1", type: "End" }
    ]
  };
  const sampleFlowchart_DecisionMissingPath = {
    startBlockId: "start1",
    blocks: [
      { id: "start1", type: "Start", nextBlock: "dec1" },
      { id: "dec1", type: "Decision", condition: "A > 1", trueBlock: "end1" /*falseBlock missing*/ },
      { id: "end1", type: "End" }
    ],
  };
   const sampleFlowchart_ProcessBadExpr = {
    startBlockId: "start1",
    blocks: [
      { id: "start1", type: "Start", nextBlock: "proc1"},
      { id: "proc1", type: "Process", operation: "A = undef * 2", nextBlock: "end1"},
      { id: "end1", type: "End" }
    ]
  };
   const sampleFlowchart_ProcessMissingOp = {
    startBlockId: "start1",
    blocks: [
      { id: "start1", type: "Start", nextBlock: "proc1"},
      { id: "proc1", type: "Process", nextBlock: "end1"}, // operation missing
      { id: "end1", type: "End" }
    ]
  };


  console.log("Valid Flowchart Errors:", JSON.stringify(validateFlowchart(sampleFlowchart_Valid), null, 2));
  console.log("No Start ID Errors:", JSON.stringify(validateFlowchart(sampleFlowchart_NoStartId), null, 2));
  console.log("Bad Start ID Errors:", JSON.stringify(validateFlowchart(sampleFlowchart_BadStartId), null, 2));
  console.log("No End Block Errors:", JSON.stringify(validateFlowchart(sampleFlowchart_NoEndBlock), null, 2));
  console.log("Unreachable Block Errors:", JSON.stringify(validateFlowchart(sampleFlowchart_Unreachable), null, 2));
  console.log("Decision Missing Path Errors:", JSON.stringify(validateFlowchart(sampleFlowchart_DecisionMissingPath), null, 2));
  console.log("Process Bad Expression Errors:", JSON.stringify(validateFlowchart(sampleFlowchart_ProcessBadExpr), null, 2));
  console.log("Process Missing Op Errors:", JSON.stringify(validateFlowchart(sampleFlowchart_ProcessMissingOp), null, 2));

  const sampleFlowchart_NoBlocks = { startBlockId: "s1", blocks: []};
  console.log("No Blocks Errors:", JSON.stringify(validateFlowchart(sampleFlowchart_NoBlocks), null, 2));

  const sampleFlowchart_DataMissing = null;
  console.log("Data Missing Errors:", JSON.stringify(validateFlowchart(sampleFlowchart_DataMissing), null, 2));
}
*/
