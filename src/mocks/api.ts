// THIS IS A MOCK API IMPLEMENTATION INTENDED FOR TESTING (E.G., JEST, STORYBOOK)
// AND SHOULD NOT BE USED IN PRODUCTION OR DEVELOPMENT BUILDS THAT TARGET A LIVE BACKEND.
// Application code should use services from 'src/services/api.ts' or similar.

import { ChatMessage, ExerciseContext } from '../store/chatStore'; // Assuming ExerciseContext and ChatMessage are exported from chatStore

interface ApiChatRequest {
  message: string;
  exerciseContext: ExerciseContext | null;
}

interface ApiChatResponse {
  reply: ChatMessage;
}

// Mock API delay
const MOCK_API_DELAY = 1000;

export const postChatMessage = (data: ApiChatRequest): Promise<ApiChatResponse> => {
  console.log('Mock API /api/chat called with:', data);

  return new Promise((resolve) => {
    setTimeout(() => {
      const exerciseTitle = data.exerciseContext?.title || "the current exercise";
      const userMessage = data.message; // Keep original case for command parsing
      let botResponseText = "";
      let isStructured = false;

      if (userMessage.toLowerCase().startsWith("/generate ")) {
        const description = userMessage.substring("/generate ".length);
        botResponseText = JSON.stringify({
          nodes: [
            { id: "1", type: "start", label: "Start", x: 50, y: 50, width: 100, height: 40 },
            { id: "2", type: "process", label: `Process: ${description}`, x: 50, y: 150, width: 150, height: 60 },
            { id: "3", type: "end", label: "End", x: 50, y: 250, width: 100, height: 40 },
          ],
          edges: [
            { id: "e1-2", source: "1", target: "2" },
            { id: "e2-3", source: "2", target: "3" },
          ],
          problemStatement: `Flowchart for: ${description}`,
          inputType: "string",
          outputType: "string",
          sampleInputs: ["test input"],
          sampleOutputs: ["test output"]
        });
        isStructured = true;
      } else {
        // Existing mock logic for non-generate commands
        botResponseText = `I've received your message about "${exerciseTitle}": "${data.message}". `;
        const lowerUserMessage = userMessage.toLowerCase();
        if (lowerUserMessage.includes("stuck")) {
          botResponseText += "It's okay to feel stuck! Let's try to break it down. What part is confusing you the most?";
        } else if (lowerUserMessage.includes("hint")) {
          botResponseText += "Sure, here's a hint: Think about the main goal of this exercise. What's the first step you might take?";
        } else if (lowerUserMessage.includes("answer") || lowerUserMessage.includes("solution")) {
          botResponseText += "I can help you with the solution if you're really stuck. Are you sure you want to see it? Maybe try one more time with a small hint first?";
        } else {
          botResponseText += "I'm here to help! How can I assist you with this exercise?";
        }

        if (data.exerciseContext?.isCorrect === true) {
          botResponseText = `Looks like you've already solved "${exerciseTitle}" correctly! Great job! Do you have any questions about it, or are you ready to move on?`;
        } else if (data.exerciseContext?.isCorrect === false && data.exerciseContext?.errorMessage) {
          botResponseText += ` I see you have an error: "${data.exerciseContext.errorMessage}". Let's look at that.`;
        }
      }

      const response: ApiChatResponse = {
        reply: {
          id: Date.now().toString() + '-bot',
          sender: 'assistant',
          text: botResponseText,
          timestamp: Date.now(),
          // Potentially add isStructured to the ChatMessage type if the frontend needs to distinguish
          // For now, the frontend will have to parse the text to see if it's JSON.
        },
      };
      console.log('Mock API /api/chat responding with:', response, 'Is Structured:', isStructured);
      resolve(response);
    }, MOCK_API_DELAY);
  });
};
