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
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'default' | 'yes' | 'no';
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}