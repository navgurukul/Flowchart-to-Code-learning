import { FlowchartData, FlowchartNode } from '../types'; // Assuming SafeCodeExecutor is not needed for basic generation
// import { SafeCodeExecutor } from './codeExecutor'; // If validation is needed here

/**
 * Generates JavaScript code from flowchart data.
 * This version is adapted from App.tsx.
 */
export const generateCodeFromFlowchartObject = (flowchart: FlowchartData): string => {
  if (!flowchart || flowchart.nodes.length === 0) return '// Flowchart is empty. Please build a flowchart.';

  // TODO: Consider if SafeCodeExecutor.validateFlowchartLogic is needed here
  // For now, focusing on direct generation as per App.tsx's logic.
  // const errors = SafeCodeExecutor.validateFlowchartLogic(flowchart.nodes, flowchart.edges);
  // if (errors.length > 0) {
  //   return `// Flowchart validation errors:\n// ${errors.join('\n// ')}\n\nfunction solution() {\n  // Fix the flowchart structure first\n  return "error";\n}`;
  // }

  let code = 'function solution(';

  const inputNodes = flowchart.nodes.filter(node => node.type === 'input');
  if (inputNodes.length > 0) {
    const params = inputNodes.map((node, index) => {
      // Ensure node.data and node.data.label exist
      const label = node.data?.label || `input${index + 1}`;
      return label.toLowerCase().replace(/[^a-z0-9_]/g, '') || `param${index + 1}`;
    }).join(', ');
    code += params;
  }
  code += ') {\n';

  // Add variable declarations for inputs based on their labels
  inputNodes.forEach((node, index) => {
    const label = node.data?.label || `input${index + 1}`;
    const varName = label.toLowerCase().replace(/[^a-z0-9_]/g, '') || `param${index + 1}`;
    // For GamePage, we might not need this detailed comment or explicit declaration if params are directly used.
    // However, keeping it for consistency with original logic.
    code += `  // Input: ${label} (mapped to parameter ${varName})\n`;
  });

  // Simplified processing for nodes:
  // This is a basic approach. A more robust solution would trace execution flow.
  // For now, it processes nodes by type in a set order.

  flowchart.nodes.forEach(node => {
    switch (node.type) {
      case 'process':
        if (node.data?.value && node.data.value.trim()) {
          const statement = node.data.value.endsWith(';') ? node.data.value : node.data.value + ';';
          code += `  ${statement}\n`;
        } else if (node.data?.label) {
          code += `  // Process: ${node.data.label}\n`;
        }
        break;
      case 'decision':
        if (node.data?.condition && node.data.condition.trim()) {
          code += `  if (${node.data.condition}) {\n`;
          code += `    // TODO: Implement logic for YES path from decision "${node.data.label || 'condition'}"\n`;
          code += `  } else {\n`;
          code += `    // TODO: Implement logic for NO path from decision "${node.data.label || 'condition'}"\n`;
          code += `  }\n`;
        } else if (node.data?.label) {
          code += `  // Decision: ${node.data.label}\n`;
        }
        break;
      case 'loop': // Basic loop structure, assumes 'while'
        if (node.data?.label) { // Loop nodes might not have a 'condition' field in the same way decisions do
          code += `  // Loop: ${node.data.label}\n`;
          if (node.data?.condition) { // If a condition field exists on loop node data
             code += `  while (${node.data.condition}) {\n`;
             code += `    // TODO: Implement loop body for "${node.data.label}"\n`;
             code += `  }\n`;
          } else {
             code += `  // TODO: Define loop condition and body for "${node.data.label}"\n`;
          }
        }
        break;
      // Input nodes are handled by function parameters.
      // Output nodes determine the return statement.
      // Start/End nodes define the function scope.
      default:
        break;
    }
  });

  const outputNodes = flowchart.nodes.filter(node => node.type === 'output');
  if (outputNodes.length > 0) {
    // Taking the first output node as the return value source.
    const outputNode = outputNodes[0];
    const outputValue = outputNode.data?.value || outputNode.data?.label?.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'result';

    // Check if the outputValue is likely a variable name vs. a string literal
    if (outputValue && (outputValue.includes(' ') || outputValue.startsWith('"') || outputValue.startsWith("'"))) {
      // If it contains spaces or is quoted, treat as a string literal to be returned
      code += `  return "${outputValue.replace(/"/g, '\\"')}";\n`;
    } else if (outputValue && (outputValue.toLowerCase() === 'true' || outputValue.toLowerCase() === 'false')) {
        // Handle boolean literals
        code += `  return ${outputValue.toLowerCase()};\n`
    } else if (outputValue && !isNaN(parseFloat(outputValue)) && isFinite(Number(outputValue))) {
        // Handle numeric literals
        code += `  return ${outputValue};\n`
    }
    else if (outputValue) {
      // Otherwise, assume it's a variable or an expression to be returned
      code += `  return ${outputValue};\n`;
    } else {
      code += `  // No specific output value defined, default return\n  return undefined;\n`;
    }
  } else {
    code += '  // No output node found. Ensure your flowchart has an output for a return value.\n';
    code += '  return undefined;\n';
  }

  code += '}';
  return code;
};

/**
 * Normalizes JavaScript code by removing comments, trimming whitespace,
 * and standardizing line breaks and spacing around braces/parentheses.
 * This helps in comparing generated code with expected code.
 */
export const normalizeCode = (code: string): string => {
  if (!code) return '';
  // Remove single-line comments
  let normalized = code.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove extra whitespace and standardize line breaks
  normalized = normalized.replace(/\s*\n\s*/g, '\n'); // Standardize line breaks
  normalized = normalized.replace(/[ \t]+/g, ' ');    // Replace multiple spaces/tabs with single space
  // Standardize spacing around operators, braces, parentheses (basic)
  normalized = normalized.replace(/\s*([={}();:,%])\s*/g, '$1'); // Remove space around common delimiters
  normalized = normalized.replace(/([+\-*/&|<>!=])(?!\1)/g, ' $1 '); // Add space around operators (except multi-char like ++, --, ==, ===)
  normalized = normalized.replace(/\s+/g, ' ').trim(); // Collapse multiple spaces to one and trim
  return normalized;
};
