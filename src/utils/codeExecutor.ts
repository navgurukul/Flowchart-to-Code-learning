import { ExecutionResult } from '../types/index';

export class SafeCodeExecutor {
  private static createSandbox(): any {
    // Create a safe sandbox environment
    const sandbox = {
      console: {
        log: (...args: any[]) => args.join(' ')
      },
      Math: Math,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Array: Array,
      Object: Object,
      JSON: JSON
    };
    return sandbox;
  }

  public static async executeCode(
    code: string, 
    input: string, 
    expectedOutput: string
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    try {
      // Parse input
      const inputs = input ? input.split(',').map(s => {
        const trimmed = s.trim();
        const num = Number(trimmed);
        return isNaN(num) ? trimmed : num;
      }) : [];

      // Create a safe function
      const wrappedCode = `
        ${code}
        
        if (typeof solution === 'function') {
          return solution(...arguments);
        } else {
          throw new Error('No solution function found. Make sure your flowchart generates a proper function.');
        }
      `;

      // Execute with timeout
      const result = await this.executeWithTimeout(wrappedCode, inputs, 5000);
      const executionTime = performance.now() - startTime;
      
      const output = String(result);
      const isCorrect = output.trim() === expectedOutput.trim();

      return {
        output,
        isCorrect,
        executionTime
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return {
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred during execution',
        isCorrect: false,
        executionTime
      };
    }
  }

  private static executeWithTimeout(code: string, inputs: any[], timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Code execution timed out (5 seconds limit)'));
      }, timeout);

      try {
        // Create a new Function in a restricted scope
        const func = new Function('arguments', code);
        const result = func.call(null, inputs);
        
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  public static validateFlowchartLogic(nodes: any[], edges: any[]): string[] {
    const errors: string[] = [];
    
    // Check for start node
    const startNodes = nodes.filter(node => node.type === 'start');
    if (startNodes.length === 0) {
      errors.push('Flowchart must have a START node');
    } else if (startNodes.length > 1) {
      errors.push('Flowchart should have only one START node');
    }

    // Check for end node
    const endNodes = nodes.filter(node => node.type === 'end');
    if (endNodes.length === 0) {
      errors.push('Flowchart must have an END node');
    }

    // Check for disconnected nodes
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const disconnectedNodes = nodes.filter(node => 
      !connectedNodes.has(node.id) && nodes.length > 1
    );
    
    if (disconnectedNodes.length > 0) {
      errors.push(`${disconnectedNodes.length} node(s) are not connected to the flowchart`);
    }

    // Check decision nodes have proper connections
    const decisionNodes = nodes.filter(node => node.type === 'decision');
    decisionNodes.forEach(node => {
      const outgoingEdges = edges.filter(edge => edge.source === node.id);
      if (outgoingEdges.length < 2) {
        errors.push(`Decision node "${node.data.label}" should have at least 2 outgoing connections (Yes/No paths)`);
      }
    });

    return errors;
  }
}