import { FlowchartNodeType } from './index'; // Assuming FlowchartNodeType is exported from here

export interface Mission {
  id: string;
  title: string;
  description: string;
  problemStatement: string; // More detailed problem if needed
  requiredNodes?: FlowchartNodeType[]; // Optional: specific nodes player should use
  sampleInput?: any; // To help player test, similar to exercises
  expectedOutput?: any; // To help player test, similar to exercises
  expectedCode: string; // The target JavaScript code for validation
  hints?: string[]; // Optional hints for the player
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number; // Experience points or score for completing
}
