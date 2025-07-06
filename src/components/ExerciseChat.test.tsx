import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExerciseChat from './ExerciseChat';
import useChatStore from '../store/chatStore';
import { postChatMessage } from '../mocks/api';

// Mock the zustand store
jest.mock('../store/chatStore');

// Mock the API
jest.mock('../mocks/api');

const mockUseChatStore = useChatStore as jest.MockedFunction<typeof useChatStore>;
const mockPostChatMessage = postChatMessage as jest.MockedFunction<typeof postChatMessage>;

describe('ExerciseChat', () => {
  let mockAddMessage: jest.Mock;
  let mockLoadHistory: jest.Mock;
  let mockToggleVisibility: jest.Mock;
  let mockRequestResync: jest.Mock;

  beforeEach(() => {
    mockAddMessage = jest.fn();
    mockLoadHistory = jest.fn();
    mockToggleVisibility = jest.fn();
    mockRequestResync = jest.fn();

    mockUseChatStore.mockImplementation((selector) => {
      const state = {
        isVisible: true,
        currentExerciseId: 'ex1',
        exerciseContext: {
          exerciseId: 'ex1',
          title: 'Sum of Two Numbers',
          userCode: '',
          isCorrect: null,
          errorMessage: null,
          previousHints: null,
        },
        chatHistory: {},
        addMessage: mockAddMessage,
        loadHistory: mockLoadHistory,
        toggleVisibility: mockToggleVisibility,
        requestResync: mockRequestResync,
        lastResyncRequested: null,
        setExerciseContext: jest.fn(),
      };
      if (selector) {
        return selector(state);
      }
      return state;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should display greeting message on first open for an exercise', () => {
    mockLoadHistory.mockReturnValue([]); // No history

    render(<ExerciseChat />);

    expect(mockAddMessage).toHaveBeenCalledTimes(1);
    expect(mockAddMessage).toHaveBeenCalledWith('ex1', {
      id: expect.any(String),
      sender: 'assistant',
      text: 'Hi 👋 I’m FlowBot! Ready to help you with "Sum of Two Numbers".',
      timestamp: expect.any(Number),
    });
  });

  test('should not display greeting message if history exists', () => {
    mockLoadHistory.mockReturnValue([
      { id: '1', sender: 'user', text: 'Hello', timestamp: Date.now() },
    ]); // History exists

    render(<ExerciseChat />);

    expect(mockAddMessage).not.toHaveBeenCalled();
  });

  test('should send user message and receive bot response for /generate command', async () => {
    mockLoadHistory.mockReturnValue([]); // Start with no history for simplicity, greeting will be added

    const mockBotResponse = {
      id: 'bot-resp-1',
      sender: 'assistant' as 'assistant',
      text: JSON.stringify({ success: true, data: "flowchart data for 'test'" }),
      timestamp: Date.now() + 1,
    };
    mockPostChatMessage.mockResolvedValue({ reply: mockBotResponse });

    render(<ExerciseChat />);

    // Greeting message call
    expect(mockAddMessage).toHaveBeenCalledTimes(1);

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: '/generate test' } });
    fireEvent.click(sendButton);

    // User message
    expect(mockAddMessage).toHaveBeenCalledWith('ex1', {
      id: expect.any(String),
      sender: 'user',
      text: '/generate test',
      timestamp: expect.any(Number),
    });

    // Check API call
    expect(mockPostChatMessage).toHaveBeenCalledTimes(1);
    expect(mockPostChatMessage).toHaveBeenCalledWith({
      message: '/generate test',
      exerciseContext: {
        exerciseId: 'ex1',
        title: 'Sum of Two Numbers',
        userCode: '',
        isCorrect: null,
        errorMessage: null,
        previousHints: null,
      },
    });

    // Bot response - using await act for async state updates
    await act(async () => {
        // Wait for promises to resolve
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockAddMessage).toHaveBeenCalledTimes(3); // Greeting + User Message + Bot Response
    expect(mockAddMessage).toHaveBeenCalledWith('ex1', mockBotResponse);
  });

  test('should display messages from history', () => {
    const messages = [
      { id: '1', sender: 'user' as 'user', text: 'Hello Bot', timestamp: Date.now() - 100 },
      { id: '2', sender: 'assistant' as 'assistant', text: 'Hello User', timestamp: Date.now() - 50 },
    ];
    mockLoadHistory.mockReturnValue(messages);

    render(<ExerciseChat />);

    expect(screen.getByText('Hello Bot')).toBeInTheDocument();
    expect(screen.getByText('Hello User')).toBeInTheDocument();
    expect(mockAddMessage).not.toHaveBeenCalled(); // No new greeting
  });

  test('chat opens and closes when toggle button is clicked', () => {
    // Initial state: visible
    render(<ExerciseChat />);
    expect(screen.getByText('Sum of Two Numbers')).toBeInTheDocument(); // Header title

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);
    expect(mockToggleVisibility).toHaveBeenCalledTimes(1);

    // Simulate store update for visibility
    mockUseChatStore.mockImplementation((selector) => {
      const state = {
        isVisible: false, // Now hidden
        currentExerciseId: 'ex1',
        exerciseContext: { exerciseId: 'ex1', title: 'Sum of Two Numbers' },
        addMessage: mockAddMessage,
        loadHistory: mockLoadHistory,
        toggleVisibility: mockToggleVisibility,
        // ... other store state
      };
      if (selector) { return selector(state); }
      return state;
    });

    // Re-render or update component state to reflect store change
    // In a real app, the component would re-render. Here, we can simulate by re-rendering.
    const { rerender } = render(<ExerciseChat />);
    rerender(<ExerciseChat />); // This will now use isVisible: false

    expect(screen.getByText('Open Chat')).toBeInTheDocument(); // Button to open

    const openButton = screen.getByText('Open Chat');
    fireEvent.click(openButton);
    expect(mockToggleVisibility).toHaveBeenCalledTimes(2); // Called again
  });

});
