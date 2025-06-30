// Using 'expr-eval' library for safe expression evaluation
// Ensure this library is installed (e.g., npm install expr-eval)

import { Parser } from 'expr-eval';

/**
 * Evaluates a mathematical or logical expression string using a provided context of variables.
 *
 * @param {string} expressionStr The expression string to evaluate.
 *                                Examples: "a + b * 2", "score >= 40 && attempts < 3", "name == 'admin'".
 * @param {object} variablesContext An object where keys are variable names and values are their current values.
 *                                  Example: { a: 2, b: 3, score: 50, attempts: 2, name: "admin" }
 * @returns {any} The result of the evaluation. This can be a number, boolean, or string
 *                depending on the expression.
 * @throws {Error} If the expression is invalid (e.g., syntax error, undefined variable not in context).
 */
export function evaluateExpression(expressionStr, variablesContext = {}) {
  if (typeof expressionStr !== 'string' || expressionStr.trim() === '') {
    throw new Error('Expression string cannot be empty.');
  }

  try {
    // Create a new parser instance
    const parser = new Parser({
      operators: {
        // Standard operators are included by default:
        // arithmetic: + - * / %
        // comparison: == != > >= < <=
        // logical: && || !
        // We can add custom ones if needed later
      }
    });

    // Parse the expression
    const expression = parser.parse(expressionStr);

    // Evaluate the expression with the provided variable context
    // The library handles undefined variables within the expression itself by throwing an error,
    // which is good for our use case.
    return expression.evaluate(variablesContext);
  } catch (e) {
    // Enhance error message for clarity
    let errorMessage = `Error evaluating expression: "${expressionStr}".`;
    if (e.message) {
      // e.g. "undefined variable a"
      if (e.message.startsWith('undefined variable')) {
        errorMessage = `Error: ${e.message}. Please ensure all variables are defined before use.`;
      } else {
        errorMessage = `Error in expression "${expressionStr}": ${e.message}.`;
      }
    }
    // Re-throw a new error with a more user-friendly or context-specific message
    // Or, depending on desired behavior, return a specific error object/value
    throw new Error(errorMessage);
  }
}

/**
 * Validates an expression string for syntactical correctness and presence of variables in a known set.
 * This function does not execute the expression but checks if it *can* be parsed
 * and if all used variables are declared.
 *
 * @param {string} expressionStr The expression string to validate.
 * @param {object} knownVariablesContext An object representing variables expected to be available.
 *                                       Values are not strictly necessary, but keys are.
 *                                       Example: { a: null, b: null, score: null }
 * @returns {{ isValid: boolean, message: string }} An object indicating if the expression is valid,
 *                                                 and a message if it's not.
 */
export function validateExpression(expressionStr, knownVariablesContext = {}) {
  if (typeof expressionStr !== 'string' || expressionStr.trim() === '') {
    return { isValid: false, message: 'Expression string cannot be empty.' };
  }

  try {
    const parser = new Parser();
    const expression = parser.parse(expressionStr);
    const variablesInExpression = expression.variables(); // Get variables used in the expression

    // Check if all variables in the expression are present in knownVariablesContext
    for (const v of variablesInExpression) {
      if (!knownVariablesContext.hasOwnProperty(v)) {
        return {
          isValid: false,
          message: `Error: Variable "${v}" used in expression "${expressionStr}" is not defined in the known context.`,
        };
      }
    }
    return { isValid: true, message: 'Expression is syntactically valid and variables are recognized.' };
  } catch (e) {
    // This catch block will typically handle syntax errors from parser.parse()
    return { isValid: false, message: `Syntax error in expression "${expressionStr}": ${e.message}.` };
  }
}

// Example Usage (can be run with Node.js for testing):
/*
if (require.main === module) {
  console.log("Testing evaluator...");

  // Test evaluateExpression
  try {
    console.log("2 + 3 * 4 with {}:", evaluateExpression("2 + 3 * 4")); // Expected: 14
    console.log("a + b * 2 with {a: 5, b: 10}:", evaluateExpression("a + b * 2", { a: 5, b: 10 })); // Expected: 25
    console.log("score >= 40 && attempts < 3 with {score: 50, attempts: 2}:", evaluateExpression("score >= 40 && attempts < 3", { score: 50, attempts: 2 })); // Expected: true
    console.log("score >= 40 && attempts < 3 with {score: 30, attempts: 2}:", evaluateExpression("score >= 40 && attempts < 3", { score: 30, attempts: 2 })); // Expected: false
    console.log("'hello ' + world with {world: 'user'}:", evaluateExpression("'hello ' + world", { world: 'user' })); // Expected: "hello user"
    // console.log("2 / 0:", evaluateExpression("2 / 0")); // Should throw or return Infinity depending on lib
  } catch (error) {
    console.error("Evaluation Error:", error.message);
  }

  try {
    console.log("Testing undefined variable:");
    evaluateExpression("x + 5", { y: 10 }); // Expected to throw
  } catch (error) {
    console.error("Evaluation Error (expected):", error.message);
  }

  try {
    console.log("Testing syntax error:");
    evaluateExpression("5 +* 3"); // Expected to throw
  } catch (error) {
    console.error("Evaluation Error (expected):", error.message);
  }

  // Test validateExpression
  console.log("\nTesting validateExpression...");
  console.log(validateExpression("a + b", { a: 1, b: 1 })); // Expected: { isValid: true, ... }
  console.log(validateExpression("a + c", { a: 1, b: 1 })); // Expected: { isValid: false, message: "...Variable \"c\"..." }
  console.log(validateExpression("a + ?", { a: 1 }));     // Expected: { isValid: false, message: "Syntax error..." }
  console.log(validateExpression("user == 'admin'", {user: "test"})); // Expected: { isValid: true, ... }

  // Test with empty expression
  try {
    evaluateExpression("");
  } catch (e) {
    console.error("Empty expr eval:", e.message);
  }
  console.log("Empty expr validate:", validateExpression(""));

}
*/
