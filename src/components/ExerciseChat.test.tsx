import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExerciseChat from './ExerciseChat';
import useChatStore from '../store/chatStore';
import { postChatMessage } from '../mocks/api';

import { postRealChatMessage } from '../services/api'; // Import the actual function

// Mock the zustand store
vi.mock('../store/chatStore');

// Mock the services/api module
vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any), // Preserve other exports from the module
    postRealChatMessage: vi.fn(), // Mock only postRealChatMessage
  };
});


const mockUseChatStore = useChatStore as vi.MockedFunction<typeof useChatStore>;
const mockPostRealChatMessage = postRealChatMessage as vi.MockedFunction<typeof postRealChatMessage>;


describe('ExerciseChat', () => {
  let mockAddMessage: vi.Mock;
  let mockLoadHistory: vi.Mock;
  let mockToggleVisibility: vi.Mock;
  let mockRequestResync: vi.Mock;
  let mockSetGeneratedFlowchartData: vi.Mock;
  let mockSetIsGeneratingFlowchart: vi.Mock;
  let mockOpenChatInStore: vi.Mock;


  beforeEach(() => {
    mockAddMessage = vi.fn();
    mockLoadHistory = vi.fn();
    mockToggleVisibility = vi.fn();
    mockOpenChatInStore = vi.fn();
    mockRequestResync = vi.fn();
    mockSetGeneratedFlowchartData = vi.fn();
    mockSetIsGeneratingFlowchart = vi.fn();

    // Setup scrollIntoView mock
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    // Default mock for loadHistory to prevent undefined errors
    mockLoadHistory.mockReturnValue([]);

    mockUseChatStore.mockImplementation((selector: any) => {
      // This function needs to correctly simulate the part of the store's state
      // that the component will subscribe to.
      // If a test needs a specific history, it should set it up in mockLoadHistory.
      const baseState = {
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
        addMessage: mockAddMessage,
        loadHistory: mockLoadHistory, // Uses the default mock or test-specific one
        toggleVisibility: mockToggleVisibility,
        openChat: mockOpenChatInStore, // Added
        requestResync: mockRequestResync,
        lastResyncRequested: null,
        setExerciseContext: vi.fn(),
        setGeneratedFlowchartData: mockSetGeneratedFlowchartData,
        setIsGeneratingFlowchart: mockSetIsGeneratingFlowchart,
        setIsCheatModeSource: vi.fn(), // Mock for setIsCheatModeSource
        // chatHistory is part of the internal state of useChatStore,
        // but components usually get messages via loadHistory.
      };
      const fullState = {
        ...baseState,
        // Ensure all functions that might be called via getState() are present
        setIsCheatModeSource: vi.fn(),
        // Add any other functions here if needed by other tests or component logic accessed via getState
      };

      // This ensures that when the component calls useChatStore.getState(),
      // it gets a complete state object including necessary functions.
      (useChatStore as any).getState = () => fullState;

      // Simulating how Zustand selectors work:
      if (typeof selector === 'function') {
        return selector(fullState); // Pass the more complete state to selectors
      }
      return fullState; // Fallback for direct use of the hook without selector
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset scrollIntoView mock after each test if necessary
    delete (window.HTMLElement.prototype as any).scrollIntoView;
  });

  const mockOnChatInteraction = vi.fn();

  test('should display greeting message on first open for an exercise', () => {
    mockLoadHistory.mockReturnValue([]); // No history

    render(<ExerciseChat onChatInteraction={mockOnChatInteraction} />);

    expect(mockAddMessage).toHaveBeenCalledTimes(1);
    // Default greeting
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

    render(<ExerciseChat onChatInteraction={mockOnChatInteraction} />);

    expect(mockAddMessage).not.toHaveBeenCalled();
  });

  test('should call onChatInteraction when user sends a message', () => {
    mockLoadHistory.mockReturnValue([]);
    render(<ExerciseChat onChatInteraction={mockOnChatInteraction} />);

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByText('Send');
    fireEvent.change(input, { target: { value: 'Hello there' } });
    fireEvent.click(sendButton);

    expect(mockOnChatInteraction).toHaveBeenCalledTimes(1);
  });


  test('should send user message and receive bot response for /generate command', async () => {
    mockLoadHistory.mockReturnValue([]); // Start with no history for simplicity, greeting will be added

    const mockBotResponse = {
      id: 'bot-resp-1',
      sender: 'assistant' as 'assistant',
      text: JSON.stringify({ nodes: [], edges: [] }), // Ensure valid flowchart structure
      timestamp: Date.now() + 1,
      isStructuredData: true,
    };
    // Mock the specific API function used by the component
    // Ensure the mock returns an object with a 'reply' property
    mockPostRealChatMessage.mockResolvedValue({
      reply: mockBotResponse
    });

    render(<ExerciseChat onChatInteraction={mockOnChatInteraction} />);

    // Greeting message call
    expect(mockAddMessage).toHaveBeenCalledTimes(1); // From the initial greeting

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
    expect(mockPostRealChatMessage).toHaveBeenCalledTimes(1);
    expect(mockPostRealChatMessage).toHaveBeenCalledWith({
      message: 'test', // Ensure this is the message content after /generate
      command: 'generate',
      exerciseContext: { // Ensure this matches the expected structure
        currentExerciseId: 'ex1',
        title: 'Sum of Two Numbers',
      },
    });

    // Bot response - using await act for async state updates
    await act(async () => {
        // Wait for promises to resolve
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check that addMessage was called with the flowchart generated message
    expect(mockAddMessage).toHaveBeenCalledWith('ex1', {
      id: expect.stringContaining('-flowchart-generated'),
      sender: 'assistant',
      text: "Flowchart generated. You can see it on the canvas.",
      timestamp: expect.any(Number),
    });
  });

  test('should display messages from history', () => {
    const messages = [
      { id: '1', sender: 'user' as 'user', text: 'Hello Bot', timestamp: Date.now() - 100 },
      { id: '2', sender: 'assistant' as 'assistant', text: 'Hello User', timestamp: Date.now() - 50 },
    ];
    mockLoadHistory.mockReturnValue(messages);

    render(<ExerciseChat onChatInteraction={mockOnChatInteraction} />);

    expect(screen.getByText('Hello Bot')).toBeInTheDocument();
    expect(screen.getByText('Hello User')).toBeInTheDocument();
    expect(mockAddMessage).not.toHaveBeenCalled(); // No new greeting
  });

  test('chat opens using openChatInStore when "Open Chat" button is clicked', () => {
    // Initial state: hidden, not forced open
    mockUseChatStore.mockImplementation((selector: any) => {
      const state = {
        isVisible: false,
        isChatForcedOpen: false, // Ensure this is part of the mocked state if your component uses it
        currentExerciseId: 'ex1',
        exerciseContext: { exerciseId: 'ex1', title: 'Sum of Two Numbers' },
        addMessage: mockAddMessage,
        loadHistory: mockLoadHistory.mockReturnValue([]),
        toggleVisibility: mockToggleVisibility,
        openChat: mockOpenChatInStore, // Use the new mock
        requestResync: mockRequestResync,
        setExerciseContext: vi.fn(),
        setGeneratedFlowchartData: mockSetGeneratedFlowchartData,
        setIsGeneratingFlowchart: mockSetIsGeneratingFlowchart,
        setIsCheatModeSource: vi.fn(),
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    render(<ExerciseChat onChatInteraction={mockOnChatInteraction} isChatForcedOpen={false} />);

    const openButton = screen.getByText('Open Chat');
    expect(openButton).toBeInTheDocument();
    fireEvent.click(openButton);

    expect(mockOpenChatInStore).toHaveBeenCalledTimes(1); // Check if openChat was called
    // toggleVisibility should not be called if openChat is the primary mechanism now
    expect(mockToggleVisibility).not.toHaveBeenCalled();
  });

  test('chat close button calls toggleVisibility', () => {
    // Initial state: visible
     mockUseChatStore.mockImplementation((selector: any) => {
      const state = {
        isVisible: true, // Start visible
        isChatForcedOpen: false,
        currentExerciseId: 'ex1',
        exerciseContext: { exerciseId: 'ex1', title: 'Sum of Two Numbers' },
        addMessage: mockAddMessage,
        loadHistory: mockLoadHistory.mockReturnValue([]),
        toggleVisibility: mockToggleVisibility, // This should be called by the close button
        openChat: mockOpenChatInStore,
        requestResync: mockRequestResync,
        setExerciseContext: vi.fn(),
        setGeneratedFlowchartData: mockSetGeneratedFlowchartData,
        setIsGeneratingFlowchart: mockSetIsGeneratingFlowchart,
        setIsCheatModeSource: vi.fn(),
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    render(<ExerciseChat onChatInteraction={mockOnChatInteraction} isChatForcedOpen={false} />);
    expect(screen.getByText('Sum of Two Numbers')).toBeInTheDocument(); // Header title, implies chat is open

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);
    expect(mockToggleVisibility).toHaveBeenCalledTimes(1); // toggleVisibility should be called to close
  });

});
