// src/types/dryRun.ts

/**
 * Represents a map of variable names to their current values during a dry run.
 * Values can be of any type supported by the expressions (e.g., number, string, boolean).
 */
export type DryRunVariableMap = Record<string, any>;

/**
 * Defines the type of a dry run log entry.
 * - 'node_process': General processing of a node.
 * - 'variable_update': A variable's value changed.
 * - 'condition_eval': A condition in a decision node was evaluated.
 * - 'loop_iteration': A loop iteration event.
 * - 'output': An output node generated a value.
 * - 'error': An error occurred during simulation.
 * - 'info': General informational message (e.g., start/end of dry run).
 */
export type DryRunLogEntryType =
  | 'node_process'
  | 'variable_update'
  | 'condition_eval'
  | 'loop_iteration'
  | 'output'
  | 'error'
  | 'info';

/**
 * Represents a single log entry in the dry run execution history.
 */
export interface DryRunStepLog {
  type: DryRunLogEntryType;
  message: string;      // Human-readable message describing the step.
  nodeId?: string;       // ID of the flowchart node this log entry pertains to.
  timestamp: string;    // ISO string timestamp of when the log entry was created.
  data?: {              // Optional additional data relevant to the log type.
    variableName?: string;
    oldValue?: any;
    newValue?: any;
    condition?: string;
    outcome?: boolean;
    outputValue?: any;
    errorDetails?: string;
    loopId?: string; // Identifier for the loop, could be the decision node's ID that starts the loop.
    iteration?: number;
  };
}

/**
 * Represents the overall state of the flowchart dry run simulation at any point.
 */
export interface DryRunState {
  currentProcessedNodeId: string | null; // The ID of the node that has just been processed.
  next предстоящийNodeId: string | null; // The ID of the next node to be processed. If null and not complete, it might be waiting for a branch decision.
  variables: DryRunVariableMap;       // Current snapshot of all variables and their values.
  log: DryRunStepLog[];               // Chronological log of execution steps and events.
  history: string[];                  // Sequence of node IDs that have been processed.
  error: string | null;               // Any error message if the simulation failed.
  isComplete: boolean;                // True if the simulation has reached an 'end' node or was terminated.
  isPaused: boolean;                  // True if the simulation is paused, waiting for "Next Step".
  loopIterations: Record<string, number>; // Tracks iteration counts for loops, e.g., { "decisionNodeId_loopStart": 3 }.
}
