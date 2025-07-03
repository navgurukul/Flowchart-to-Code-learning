// src/engine/dryRun/FlowchartSimulator.ts

import { FlowchartData, Node as FlowchartNode, Edge as FlowchartEdge } from '../../types/index'; // Assuming types/index.ts exports these
import { DryRunState, DryRunVariableMap, DryRunStepLog, DryRunLogEntryType } from '../../types/dryRun';

const MAX_LOOP_ITERATIONS = 100; // Default max loop iterations

export class FlowchartSimulator {
  private flowchartData: FlowchartData;
  private state: DryRunState;

  constructor(flowchartData: FlowchartData, initialInputs: DryRunVariableMap) {
    this.flowchartData = flowchartData;
    const startNode = this.findStartNode();

    if (!startNode) {
      this.state = {
        currentProcessedNodeId: null,
        next предстоящийNodeId: null,
        variables: { ...initialInputs },
        log: [this.createLogEntry('error', 'Dry run error: Start node not found.')],
        history: [],
        error: 'Start node not found.',
        isComplete: true,
        isPaused: false,
        loopIterations: {},
      };
      return;
    }

    this.state = {
      currentProcessedNodeId: null, // Nothing processed initially
      next предстоящийNodeId: startNode.id, // Start node is the first to be processed
      variables: { ...initialInputs }, // Initialize variables with provided inputs
      log: [this.createLogEntry('info', 'Dry run initialized. Ready to start.')],
      history: [],
      error: null,
      isComplete: false,
      isPaused: true, // Start in a paused state, waiting for first "nextStep"
      loopIterations: {},
    };
  }

  private createLogEntry(
    type: DryRunLogEntryType,
    message: string,
    nodeId?: string,
    data?: DryRunStepLog['data']
  ): DryRunStepLog {
    return {
      type,
      message,
      nodeId,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  private findStartNode(): FlowchartNode | undefined {
    return this.flowchartData.nodes.find(node => node.type === 'start');
  }

  public findNodeById(nodeId: string): FlowchartNode | undefined {
    return this.flowchartData.nodes.find(node => node.id === nodeId);
  }

  public getOutgoingEdges(nodeId: string): FlowchartEdge[] {
    return this.flowchartData.edges.filter(edge => edge.source === nodeId);
  }

  /**
   * Determines the next node ID based on the current node and potentially a decision outcome.
   * For decision nodes, 'decisionOutcome' (true for 'yes', false for 'no') should be provided.
   * For other nodes, it typically follows the single outgoing edge.
   */
  private getNextNodeId(currentNodeId: string, decisionOutcome?: boolean): string | null {
    const edges = this.getOutgoingEdges(currentNodeId);
    const currentNode = this.findNodeById(currentNodeId);

    if (!currentNode) return null;

    if (currentNode.type === 'decision') {
      if (edges.length === 0) return null; // Should ideally have at least one, ideally two for yes/no

      // Assuming edge handles might store 'yes'/'no' or rely on a convention
      // For now, let's assume 'yes' path has a specific handle or is the first one if not specified
      // This part will need refinement based on actual edge data from react-flow
      const targetEdge = edges.find(edge => {
        // A common convention for react-flow edge handles for decision nodes:
        // sourceHandle: 'yes' or 'true', 'no' or 'false'
        // Or, if no handles, we might need to rely on edge order or specific data on edges.
        // For now, a simple placeholder:
        if (decisionOutcome === true) {
          return edge.sourceHandle === 'yes' || edge.sourceHandle === 'true' || !edge.sourceHandle; // Default to first if no specific 'yes' handle
        } else {
          return edge.sourceHandle === 'no' || edge.sourceHandle === 'false';
        }
      });

      // Fallback if specific yes/no handles are not found but edges exist
      if (!targetEdge && decisionOutcome === true && edges.length > 0) return edges[0].target;
      if (!targetEdge && decisionOutcome === false && edges.length > 1) return edges[1].target;
      if (!targetEdge && decisionOutcome === false && edges.length > 0) return edges[0].target; // If only one edge from decision, it's the path

      return targetEdge ? targetEdge.target : null;

    } else { // For non-decision nodes
      if (edges.length > 0) {
        return edges[0].target; // Assume first outgoing edge is the one to follow
      }
      return null;
    }
  }

  /**
   * Returns the current state of the simulation.
   */
  public getState(): DryRunState {
    return { ...this.state, variables: { ...this.state.variables }, log: [...this.state.log], history: [...this.state.history] };
  }

  /**
   * Advances the simulation by one step.
   * Processes the `state.next предстоящийNodeId`.
   */
  public nextStep(): DryRunState {
    if (this.state.isComplete || !this.state.next предстоящийNodeId) {
      this.state.isPaused = true;
      if (!this.state.isComplete) {
          this.state.log.push(this.createLogEntry('info', 'Simulation cannot proceed further. No next node or already complete.'));
          this.state.isComplete = true; // Mark as complete if stuck
      }
      return this.getState();
    }

    this.state.isPaused = false;
    const nodeIdToProcess = this.state.next предстоящийNodeId;
    const node = this.findNodeById(nodeIdToProcess);

    if (!node) {
      this.state.error = `Node with ID '${nodeIdToProcess}' not found.`;
      this.state.log.push(this.createLogEntry('error', this.state.error, nodeIdToProcess));
      this.state.isComplete = true;
      this.state.isPaused = true;
      this.state.currentProcessedNodeId = nodeIdToProcess;
      this.state.next предстоящийNodeId = null;
      return this.getState();
    }

    // Mark current node as processed and add to history
    this.state.currentProcessedNodeId = node.id;
    this.state.history.push(node.id);

    // Placeholder: Determine next node (will be expanded for each node type)
    // For now, just log and prepare for the next step without specific node logic
    this.state.log.push(this.createLogEntry('node_process', `Processing node '${node.data.label || node.type}' (ID: ${node.id}).`, node.id));

    // In a real scenario, logic for each node type (start, end, input, process, decision) would go here.
    // For example, if (node.type === 'process') { /* evaluate expression, update variables */ }
    // Then, determine the actual nextNodeId based on that logic.

    // For this scaffolding step, we'll just try to find a generic next node.
    // This will be replaced by type-specific logic in subsequent steps.
    // const determinedNextNodeId = this.getNextNodeId(node.id);
    // this.state.next предстоящийNodeId = determinedNextNodeId;

    // --- Node Type Specific Logic ---
    switch (node.type) {
      case 'start':
        this.processStartNode(node);
        break;
      case 'end':
        this.processEndNode(node);
        break;
      case 'input':
        this.processInputNode(node);
        break;
      // case 'process':
      //   this.processProcessNode(node);
      //   break;
      // case 'decision':
      //   this.processDecisionNode(node);
      //   break;
      // case 'output':
      //   this.processOutputNode(node);
      //   break;
      default:
        // For unknown or simple nodes that just pass through
        this.state.log.push(this.createLogEntry('info', `Node type '${node.type}' processed (generic).`, node.id));
        this.state.next предстоящийNodeId = this.getNextNodeId(node.id);
        break;
    }

    if (!this.state.next предстоящийNodeId && !this.state.isComplete) {
        this.state.log.push(this.createLogEntry('info', `Node '${node.data.label || node.type}' has no outgoing path but simulation is not marked complete. Ending.`, node.id));
        this.state.isComplete = true;
    }

    // if (node.type === 'end') { // This is now handled in processEndNode
    //     this.state.isComplete = true;
    //     this.state.next предстоящийNodeId = null; // No next node after end
    //     this.state.log.push(this.createLogEntry('info', `Reached end node '${node.data.label || node.type}'. Dry run complete.`, node.id));
    // }


    this.state.isPaused = true; // Pause after each step
    return this.getState();
  }

  private processStartNode(node: FlowchartNode): void {
    this.state.log.push(this.createLogEntry('node_process', `Start node '${node.data.label || 'Start'}' executed.`, node.id));
    this.state.next предстоящийNodeId = this.getNextNodeId(node.id);
  }

  private processEndNode(node: FlowchartNode): void {
    this.state.log.push(this.createLogEntry('node_process', `End node '${node.data.label || 'End'}' reached. Dry run complete.`, node.id));
    this.state.isComplete = true;
    this.state.next предстоящийNodeId = null;
  }

  private processInputNode(node: FlowchartNode): void {
    // Input values are assumed to be pre-loaded into `this.state.variables` by the constructor
    // based on what DryRunInputModal collects.
    // The variable name is derived from the node's label or ID.
    const varName = node.data.label?.trim().replace(/\s+/g, '_') || node.id;
    const value = this.state.variables[varName];

    let message = `Input node '${node.data.label || `Input (ID: ${node.id})`}' processed. Variable '${varName}'`;
    if (value !== undefined) {
      message += ` = ${JSON.stringify(value)}.`;
    } else {
      message += ` (no value provided/found).`;
      // Optionally, treat as an error or assign a default (e.g., null or empty string) if desired
      // For now, just logging that it wasn't found in the pre-loaded inputs.
      // This might happen if DryRunInputModal logic for varName differs, or input wasn't provided.
    }

    this.state.log.push(this.createLogEntry('node_process', message, node.id, { variableName: varName, newValue: value }));
    this.state.next предстоящийNodeId = this.getNextNodeId(node.id);
  }

  // TODO: Implement methods for specific node type processing
  // private processProcessNode(node: FlowchartNode): void { ... }
  // private processDecisionNode(node: FlowchartNode): void { ... }
  // private processOutputNode(node: FlowchartNode): void { ... }
  // private processEndNode(node: FlowchartNode): void { ... } // Implemented

  // TODO: Implement evaluateExpression for Process and Decision nodes
  // private evaluateExpression(expression: string, variables: DryRunVariableMap): any { ... }
}
