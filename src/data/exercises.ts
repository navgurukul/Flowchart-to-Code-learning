import { Exercise } from '../types/index';

export const exercises: Exercise[] = [
  {
    id: 1,
    title: "Hello World Program",
    description: "Create a flowchart that displays 'Hello, World!' to the user.",
    problemStatement: "Build a simple flowchart that outputs the text 'Hello, World!' when executed. This is your first step into programming logic!",
    sampleInput: "",
    expectedOutput: "Hello, World!",
    difficulty: 'beginner',
    category: 'Basic Output',
    hints: [
      "Start with a START node",
      "Add an OUTPUT node with the text 'Hello, World!'",
      "End with an END node",
      "Connect them in sequence"
    ],
    requiredNodes: ['start', 'output', 'end']
  },
  {
    id: 2,
    title: "Sum of Two Numbers",
    description: "Create a flowchart to add two numbers and display the result.",
    problemStatement: "Design a flowchart that takes two numbers as input, adds them together, and outputs the sum.",
    sampleInput: "5, 3",
    expectedOutput: "8",
    difficulty: 'beginner',
    category: 'Arithmetic Operations',
    hints: [
      "Use INPUT nodes to get the two numbers",
      "Use a PROCESS node to calculate the sum",
      "Use an OUTPUT node to display the result",
      "Don't forget START and END nodes"
    ],
    requiredNodes: ['start', 'input', 'process', 'output', 'end']
  },
  {
    id: 3,
    title: "Even or Odd Checker",
    description: "Determine whether a given number is even or odd using a flowchart.",
    problemStatement: "Create a flowchart that takes a number as input and determines if it's even or odd, then displays the appropriate message.",
    sampleInput: "4",
    expectedOutput: "Even",
    difficulty: 'beginner',
    category: 'Conditional Logic',
    hints: [
      "Use an INPUT node to get the number",
      "Use a DECISION node to check if number % 2 == 0",
      "Use OUTPUT nodes for both 'Even' and 'Odd' results",
      "Connect the decision paths correctly"
    ],
    requiredNodes: ['start', 'input', 'decision', 'output', 'end']
  },
  {
    id: 4,
    title: "Maximum of Three Numbers",
    description: "Find the largest among three given numbers using flowchart logic.",
    problemStatement: "Design a flowchart that takes three numbers as input and determines which one is the largest, then outputs that number.",
    sampleInput: "10, 25, 15",
    expectedOutput: "25",
    difficulty: 'intermediate',
    category: 'Conditional Logic',
    hints: [
      "Use multiple INPUT nodes for the three numbers",
      "Use nested DECISION nodes to compare the numbers",
      "Consider using a PROCESS node to track the maximum",
      "Think about the comparison logic step by step"
    ],
    requiredNodes: ['start', 'input', 'decision', 'process', 'output', 'end']
  },
  {
    id: 5,
    title: "Factorial Calculator",
    description: "Calculate the factorial of a given positive integer using a loop.",
    problemStatement: "Create a flowchart that calculates the factorial of a number using iterative logic (loops).",
    sampleInput: "5",
    expectedOutput: "120",
    difficulty: 'intermediate',
    category: 'Loops',
    hints: [
      "Initialize a counter and result variable",
      "Use a LOOP node to repeat the multiplication",
      "Use a DECISION node to check the loop condition",
      "Update both the result and counter in each iteration"
    ],
    requiredNodes: ['start', 'input', 'process', 'loop', 'decision', 'output', 'end']
  },
  {
    id: 6,
    title: "Prime Number Checker",
    description: "Check if a given number is prime using flowchart logic.",
    problemStatement: "Design a flowchart that determines whether a given number is prime (only divisible by 1 and itself).",
    sampleInput: "17",
    expectedOutput: "Prime",
    difficulty: 'intermediate',
    category: 'Loops',
    hints: [
      "Handle special cases (numbers <= 1)",
      "Use a loop to check for divisors from 2 to n-1",
      "Use a DECISION node to check if any divisor is found",
      "Output 'Prime' or 'Not Prime' accordingly"
    ],
    requiredNodes: ['start', 'input', 'decision', 'loop', 'process', 'output', 'end']
  }
];

// Generate remaining exercises programmatically
const additionalExercises: Exercise[] = [];

const exerciseTemplates = [
  {
    title: "Number Pattern Printer",
    description: "Create patterns using nested loops",
    category: "Pattern Printing",
    difficulty: 'intermediate' as const,
    requiredNodes: ['start', 'input', 'loop', 'decision', 'output', 'end'] as const
  },
  {
    title: "Array Sum Calculator",
    description: "Calculate sum of array elements",
    category: "Arrays",
    difficulty: 'beginner' as const,
    requiredNodes: ['start', 'input', 'loop', 'process', 'output', 'end'] as const
  },
  {
    title: "String Reverser",
    description: "Reverse a given string",
    category: "Strings",
    difficulty: 'beginner' as const,
    requiredNodes: ['start', 'input', 'loop', 'process', 'output', 'end'] as const
  },
  {
    title: "Fibonacci Sequence",
    description: "Generate Fibonacci numbers",
    category: "Mathematical Operations",
    difficulty: 'advanced' as const,
    requiredNodes: ['start', 'input', 'process', 'loop', 'decision', 'output', 'end'] as const
  }
];

for (let i = 7; i <= 50; i++) {
  const template = exerciseTemplates[(i - 7) % exerciseTemplates.length];
  
  additionalExercises.push({
    id: i,
    title: `${template.title} ${Math.floor((i - 7) / exerciseTemplates.length) + 1}`,
    description: `${template.description} - Challenge ${i}`,
    problemStatement: `Advanced programming challenge focusing on ${template.category.toLowerCase()}. Design a flowchart to solve this problem step by step.`,
    sampleInput: "sample input",
    expectedOutput: "expected result",
    difficulty: template.difficulty,
    category: template.category,
    hints: [
      "Break down the problem into smaller steps",
      "Use appropriate flowchart symbols",
      "Test your logic with the sample input",
      "Consider edge cases in your solution"
    ],
    requiredNodes: template.requiredNodes
  });
}

export const allExercises = [...exercises, ...additionalExercises];