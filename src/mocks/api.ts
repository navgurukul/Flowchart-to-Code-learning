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
      const userMessage = data.message.toLowerCase();
      let botResponseText = `I've received your message about "${exerciseTitle}": "${data.message}". `;

      if (userMessage.includes("stuck")) {
        botResponseText += "It's okay to feel stuck! Let's try to break it down. What part is confusing you the most?";
      } else if (userMessage.includes("hint")) {
        botResponseText += "Sure, here's a hint: Think about the main goal of this exercise. What's the first step you might take?";
      } else if (userMessage.includes("answer") || userMessage.includes("solution")) {
        botResponseText += "I can help you with the solution if you're really stuck. Are you sure you want to see it? Maybe try one more time with a small hint first?";
      } else {
        botResponseText += "I'm here to help! How can I assist you with this exercise?";
      }

      if (data.exerciseContext?.isCorrect === true) {
        botResponseText = `Looks like you've already solved "${exerciseTitle}" correctly! Great job! Do you have any questions about it, or are you ready to move on?`;
      } else if (data.exerciseContext?.isCorrect === false && data.exerciseContext?.errorMessage) {
        botResponseText += ` I see you have an error: "${data.exerciseContext.errorMessage}". Let's look at that.`;
      }


      const response: ApiChatResponse = {
        reply: {
          id: Date.now().toString() + '-bot',
          sender: 'assistant',
          text: botResponseText,
          timestamp: Date.now(),
        },
      };
      console.log('Mock API /api/chat responding with:', response);
      resolve(response);
    }, MOCK_API_DELAY);
  });
};
