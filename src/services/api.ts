import { ChatMessage, ExerciseContext } from '../store/chatStore';

interface ApiChatRequest {
  message: string;
  exerciseContext: { // Be more specific about what's needed from ExerciseContext
    currentExerciseId?: number | string | null; // Allow for flexible ID types
    title?: string | null;
  } | null;
}

interface ApiChatResponseData { // Renamed to avoid conflict if we use the same name for the function's return type
  response: string; // This is the text from the backend, could be plain string or JSON string
  isStructuredData: boolean;
}

interface BackendApiResponse { // This is what the actual backend /api/chat returns
    reply: ChatMessage; // This structure is assumed based on how mock was used.
                       // If backend returns { response: string, isStructuredData: boolean }, this needs adjustment.
                       // Let's assume the backend is adapted or will be adapted to return something compatible
                       // with the ChatMessage structure for the reply, or we transform it here.
}


// Helper to get the API base URL
const getApiBaseUrl = (): string => {
  // Using VITE_API_BASE_URL as per the new requirement
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiUrl) {
    // Fallback for local development, pointing to the typical local backend port
    console.warn("VITE_API_BASE_URL is not defined. Falling back to http://localhost:8000. Ensure your local backend is running there or set VITE_API_BASE_URL.");
    return "http://localhost:8000"; // Default to local backend URL
  }
  return apiUrl;
};

export const postRealChatMessage = async (data: ApiChatRequest): Promise<BackendApiResponse> => {
  const baseUrl = getApiBaseUrl();
  // Ensure targetUrl does not result in double slashes if baseUrl is empty or just "/"
  const targetPath = "/api/chat";
  const targetUrl = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}${targetPath}` : `${baseUrl}${targetPath}`;


  // If backend returns { response: string, isStructuredData: boolean } directly,
  // then the transformation to ChatMessage structure happens here.
  // For now, let's assume the backend returns a structure that can be mapped to ApiChatResponse's `reply`

  console.log(`[DEBUG] Attempting to post chat message to: ${targetUrl}`); // Temporary logging

  // The actual backend endpoint is /api/chat as per main.py
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Authorization header comment removed as /api/chat is now public
    },
    body: JSON.stringify({
      message: data.message,
      exercise_id: data.exerciseContext?.currentExerciseId?.toString(), // Ensure it's a string for backend
      exercise_title: data.exerciseContext?.title,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("API Error Response:", errorBody);
    throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
  }

  const responseData: ApiChatResponseData = await response.json();

  // Transform backend's { response: string, isStructuredData: boolean } to ChatMessage
  // This assumes the `responseData.response` is the text of the message.
  // If `isStructuredData` is true, `responseData.response` is a JSON string of the flowchart/data.
  const replyMessage: ChatMessage = {
    id: Date.now().toString() + '-bot-real',
    sender: 'assistant',
    text: responseData.response, // This is the raw string, could be plain text or stringified JSON
    timestamp: Date.now(),
    isStructuredData: responseData.isStructuredData, // Populate from backend response
  };

  return { reply: replyMessage };
};
