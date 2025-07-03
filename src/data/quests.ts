import { Mission } from '../types/quests';

export const allQuests: Mission[] = [
  {
    id: 'quest-001',
    title: 'The Even Steven Challenge',
    description: 'A village elder needs your help! Create a flowchart to determine if a given number is even or odd. If it\'s even, the flowchart should help decide to return "even", otherwise "odd".',
    problemStatement: 'Given a number `n`, determine if it is even or odd. Return the string "even" if the number is even, and "odd" if the number is odd.',
    requiredNodes: ['start', 'input', 'decision', 'output', 'end'],
    sampleInput: 7,
    expectedOutput: "odd",
    expectedCode: `function solution(n) {
  if (n % 2 === 0) {
    return "even";
  } else {
    return "odd";
  }
}`,
    hints: [
      'Remember the modulo operator (%) for checking divisibility.',
      'A decision node will be crucial here to check the condition.',
      'Ensure you have output nodes for both "even" and "odd" results depending on the decision.',
    ],
    difficulty: 'easy',
    xpReward: 50,
  },
  {
    id: 'quest-002',
    title: 'The Sum Summoner',
    description: 'A wizard requires a magical artifact that can sum two numbers. Construct a flowchart that takes two numbers as input and outputs their sum.',
    problemStatement: 'Given two numbers, `a` and `b`, calculate their sum. Return the sum.',
    requiredNodes: ['start', 'input', 'process', 'output', 'end'],
    sampleInput: [5, 10], // Assuming multiple inputs can be handled or represented
    expectedOutput: 15,
    expectedCode: `function solution(a, b) {
  let sum = a + b;
  return sum;
}`,
    hints: [
      'You will need two input nodes or one input node that can handle multiple values.',
      'A process node is where the addition will happen.',
      'The output node should display the calculated sum.',
    ],
    difficulty: 'easy',
    xpReward: 60,
  },
  // Add more quests here
];
