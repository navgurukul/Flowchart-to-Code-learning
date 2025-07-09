import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InputOutput } from './InputOutput';
import { Exercise, ExecutionResult } from '../types';

const mockExercise: Exercise = {
  id: 1,
  title: 'Test Exercise',
  description: 'A test exercise.',
  problemStatement: 'Solve this test problem.',
  sampleInput: 'sample input', // Will be overridden by testCases if they exist
  expectedOutput: 'sample output', // Will be overridden by testCases if they exist
  difficulty: 'beginner',
  category: 'Testing',
  hints: ['hint1'],
  testCases: [
    { input: 'test input 1', expectedOutput: 'test output 1' },
    { input: 'test input 2', expectedOutput: 'test output 2' },
    { input: '', expectedOutput: 'output for no input' },
  ],
};

const mockExerciseNoTestCases: Exercise = {
  id: 2,
  title: 'Exercise Without Test Cases',
  description: 'No test cases here.',
  problemStatement: 'Solve this.',
  sampleInput: 'fallback input',
  expectedOutput: 'fallback output',
  difficulty: 'intermediate',
  category: 'Testing',
  hints: [],
  // No testCases property
};


const mockResult: ExecutionResult = {
  output: 'test output 1',
  isCorrect: true,
  executionTime: 10,
};

describe('InputOutput Component', () => {
  test('renders correctly with multiple test cases', () => {
    render(<InputOutput exercise={mockExercise} result={null} isRunning={false} />);

    expect(screen.getByText('Input & Output')).toBeInTheDocument();
    expect(screen.getByText('Test Cases')).toBeInTheDocument();

    // Check for each test case
    expect(screen.getByText('Test Case 1:')).toBeInTheDocument();
    expect(screen.getByText('test input 1')).toBeInTheDocument();
    expect(screen.getByText('test output 1')).toBeInTheDocument();

    expect(screen.getByText('Test Case 2:')).toBeInTheDocument();
    expect(screen.getByText('test input 2')).toBeInTheDocument();
    expect(screen.getByText('test output 2')).toBeInTheDocument();

    expect(screen.getByText('Test Case 3:')).toBeInTheDocument();
    expect(screen.getByText('No input required')).toBeInTheDocument(); // For empty input string
    expect(screen.getByText('output for no input')).toBeInTheDocument();

    // Check for actual output section (should be in initial state)
    expect(screen.getByText('Your Output')).toBeInTheDocument();
    expect(screen.getByText('Click "Run Code" to see your output here')).toBeInTheDocument();
  });

  test('renders correctly when an exercise has no testCases array', () => {
    render(<InputOutput exercise={mockExerciseNoTestCases} result={null} isRunning={false} />);

    expect(screen.getByText('Input & Output')).toBeInTheDocument();
    expect(screen.getByText('Test Cases')).toBeInTheDocument();
    expect(screen.getByText('No test cases defined for this exercise.')).toBeInTheDocument();

    // Ensure it doesn't try to access sampleInput/expectedOutput from the root of exercise for display here
    // if testCases is the primary source of truth for this section now.
    // Depending on desired behavior, this part of the test might change.
    // For now, assuming "No test cases defined" is shown and it doesn't fallback to root sampleInput/Output.
    expect(screen.queryByText('fallback input')).not.toBeInTheDocument();
    expect(screen.queryByText('fallback output')).not.toBeInTheDocument();
  });

  test('renders correctly when testCases array is empty', () => {
    const exerciseWithEmptyTestCases: Exercise = {
      ...mockExercise,
      testCases: [],
    };
    render(<InputOutput exercise={exerciseWithEmptyTestCases} result={null} isRunning={false} />);

    expect(screen.getByText('Input & Output')).toBeInTheDocument();
    expect(screen.getByText('Test Cases')).toBeInTheDocument();
    expect(screen.getByText('No test cases defined for this exercise.')).toBeInTheDocument();
  });


  test('displays running state', () => {
    render(<InputOutput exercise={mockExercise} result={null} isRunning={true} />);
    expect(screen.getByText('Running code...')).toBeInTheDocument();
  });

  test('displays result correctly when provided', () => {
    render(<InputOutput exercise={mockExercise} result={mockResult} isRunning={false} />);

    // Test case display should still be there
    expect(screen.getByText('Test Case 1:')).toBeInTheDocument();
    expect(screen.getByText('test input 1')).toBeInTheDocument();
    // screen.getByText('test output 1') is removed here as it's ambiguous
    // and its presence in test cases section is already tested elsewhere.

    // Check for actual output
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    // The actual output from 'result.output' should be displayed
    // Since mockResult.output is 'test output 1', and it's also an expected output, it might be duplicated on screen.
    // We need to ensure the "Your Output" section shows the mockResult.output.
    const yourOutputSection = screen.getByText('Your Output').closest('div');
    expect(yourOutputSection).toHaveTextContent('test output 1');
    expect(screen.getByText('Execution Time')).toBeInTheDocument();
    expect(screen.getByText('10.00ms')).toBeInTheDocument();
  });

  test('displays error state correctly', () => {
    const errorResult: ExecutionResult = {
      ...mockResult,
      isCorrect: false,
      error: 'Runtime Error: Something went wrong',
    };
    render(<InputOutput exercise={mockExercise} result={errorResult} isRunning={false} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Runtime Error: Something went wrong')).toBeInTheDocument();
  });

  test('displays incorrect output state correctly', () => {
    const incorrectResult: ExecutionResult = {
      output: 'wrong output',
      isCorrect: false,
      executionTime: 12,
    };
    render(<InputOutput exercise={mockExercise} result={incorrectResult} isRunning={false} />);
    expect(screen.getByText('Incorrect Output')).toBeInTheDocument();

    const yourOutputSection = screen.getByText('Your Output').closest('div');
    expect(yourOutputSection).toHaveTextContent('wrong output');
  });
});
