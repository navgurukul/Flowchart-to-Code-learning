import { ChatMessage, ExerciseContext } from '../store/chatStore';

interface ApiChatRequest {
  message: string;
  exerciseContext: ExerciseContext | null;
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
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    console.error("VITE_API_URL is not defined. Falling back to relative path /api. This may not work in all environments.");
    // Fallback for local development if .env is not set up, assuming backend is on same host/port under /api
    // In production, VITE_API_URL should definitely be set.
    return ""; // Use relative path for /api/chat
  }
  return apiUrl;
};

export const postRealChatMessage = async (data: ApiChatRequest): Promise<BackendApiResponse> => {
  const baseUrl = getApiBaseUrl();
  const targetUrl = `${baseUrl}/api/chat`; // Construct the target URL

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
    body: JSON.stringify({ message: data.message }), // Backend expects { "message": "..." }
                                                    // It does not expect exerciseContext in the body for /api/chat
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
    // isStructuredData: responseData.isStructuredData, // Add this if ChatMessage type is extended
  };

  return { reply: replyMessage };
};
