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


  beforeEach(() => {
    mockAddMessage = vi.fn();
    mockLoadHistory = vi.fn();
    mockToggleVisibility = vi.fn();
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
        requestResync: mockRequestResync,
        lastResyncRequested: null,
        setExerciseContext: vi.fn(),
        setGeneratedFlowchartData: mockSetGeneratedFlowchartData,
        setIsGeneratingFlowchart: mockSetIsGeneratingFlowchart,
        setIsCheatModeSource: vi.fn(), // Mock for setIsCheatModeSource
        // chatHistory is part of the internal state of useChatStore,
        // but components usually get messages via loadHistory.
      };
       // getState mock
      (useChatStore as any).getState = () => ({
        ...baseState,
        setIsCheatModeSource: vi.fn(), // Ensure getState also returns this
      });

      // Simulating how Zustand selectors work:
      if (typeof selector === 'function') {
        return selector(baseState);
      }
      return baseState; // Fallback for direct use of the hook without selector
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset scrollIntoView mock after each test if necessary
    delete (window.HTMLElement.prototype as any).scrollIntoView;
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
      text: JSON.stringify({ nodes: [], edges: [] }), // Ensure valid flowchart structure
      timestamp: Date.now() + 1,
      isStructuredData: true,
    };
    // Mock the specific API function used by the component
    mockPostRealChatMessage.mockResolvedValue({ reply: mockBotResponse });

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
    // However, direct re-render might not be enough if the store subscription logic is complex.
    // It's often better to ensure the mock store behaves as expected upon calls.
    // For this test, assuming toggleVisibility leads to the component being unmounted/re-mounted or conditional rendering changes.

    // To simulate the "Open Chat" button appearing, we need to re-render with `isVisible: false`
    // This is tricky with the current mock setup if it doesn't dynamically respond to `toggleVisibility` calls.
    // A more robust way is to control the `isVisible` state directly for different render calls if needed.

    // Let's refine the mock for the "hidden" state
    mockUseChatStore.mockImplementationOnce((selector: any) => {
       const hiddenState = {
        isVisible: false,
        currentExerciseId: 'ex1',
        // other state properties...
        exerciseContext: { exerciseId: 'ex1', title: 'Sum of Two Numbers' },
        addMessage: mockAddMessage,
        loadHistory: mockLoadHistory.mockReturnValue([]), // Ensure loadHistory is appropriately mocked for this scenario
        toggleVisibility: mockToggleVisibility,
        requestResync: mockRequestResync,
        setExerciseContext: vi.fn(),
        setGeneratedFlowchartData: mockSetGeneratedFlowchartData,
        setIsGeneratingFlowchart: mockSetIsGeneratingFlowchart,
      };
      if (typeof selector === 'function') {
        return selector(hiddenState);
      }
      return hiddenState;
    });


    const { rerender } = render(<ExerciseChat />); // First render is with isVisible: true (from beforeEach)
                                                 // This instance will be based on the general beforeEach mock.

    // Click close button
    // const closeButton = screen.getByText('✕'); // Assuming this is found from the first render
    // fireEvent.click(closeButton);
    // expect(mockToggleVisibility).toHaveBeenCalledTimes(1); // From the first visible state

    // Now, to test the "Open Chat" button, we need a render where isVisible is false.
    // The previous mockUseChatStore.mockImplementationOnce sets this up for the *next* component instantiation/render cycle.
    // It's crucial that this mock also correctly sets up loadHistory.

    mockUseChatStore.mockImplementationOnce((selector: any) => {
      const hiddenState = {
        isVisible: false,
        currentExerciseId: 'ex1',
        exerciseContext: { exerciseId: 'ex1', title: 'Sum of Two Numbers' },
        addMessage: mockAddMessage,
        loadHistory: mockLoadHistory.mockReturnValue([]), // Explicitly mock loadHistory here
        toggleVisibility: mockToggleVisibility,
        requestResync: mockRequestResync,
        setExerciseContext: vi.fn(),
        setGeneratedFlowchartData: mockSetGeneratedFlowchartData,
        setIsGeneratingFlowchart: mockSetIsGeneratingFlowchart,
        setIsCheatModeSource: vi.fn(),
      };
       // Ensure getState is also available for this specific mock instance if needed by the component logic
      (hiddenState as any).getState = () => ({ ...hiddenState, setIsCheatModeSource: vi.fn() });

      if (typeof selector === 'function') {
        return selector(hiddenState);
      }
      return hiddenState;
    });

    rerender(<ExerciseChat />); // This should now use isVisible: false

    expect(screen.getByText('Open Chat')).toBeInTheDocument(); // Button to open
    const openButton = screen.getByText('Open Chat');
    fireEvent.click(openButton);
    // mockToggleVisibility would be called by the component when the openButton is clicked.
    // The count depends on how many times it was called before this specific interaction.
    // If the component was truly closed and re-opened, toggleVisibility is called again.
    expect(mockToggleVisibility).toHaveBeenCalledTimes(2); //  (once to close, once to open)
  });

});
