export interface Exercise {
  id: number;
  title: string;
  description: string;
  problemStatement: string;
  sampleInput: string;
  expectedOutput: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  hints: string[];
  requiredNodes?: FlowchartNodeType[];
  testCases?: TestCase[];
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface StudentProgress {
  completedExercises: number[];
  currentExercise: number;
  totalScore: number;
  lastAccessedAt: string;
}

export interface ExecutionResult {
  output: string;
  error?: string;
  isCorrect: boolean;
  executionTime: number;
}

export type FlowchartNodeType = 
  | 'start' 
  | 'end' 
  | 'process' 
  | 'decision' 
  | 'input' 
  | 'output' 
  | 'loop';

export interface FlowchartNode {
  id: string;
  type: FlowchartNodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    value?: string;
    condition?: string;
  };
  isDragging?: boolean;
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  label?: string; // General purpose label, might be deprecated or coexist with conditionType
  type?: 'default' | 'yes' | 'no'; // Could be used for styling, or replaced by conditionType for decision outputs
  conditionType?: 'true' | 'false' | null; // Specifically for edges from decision nodes
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}