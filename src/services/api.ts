import { ChatMessage, ExerciseContext } from '../store/chatStore';

interface ApiChatRequest {
  message: string;
  command?: 'chat' | 'learn' | 'generate'; // Added command field
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
      command: data.command || 'chat', // Pass the command, default to 'chat'
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

// --- "Fix It" Button Functionality: Types and API call for patching flowchart ---

// Import FlowchartData and FlowchartNodeType from where they are defined (e.g., ../types)
import { FlowchartData, FlowchartNodeType, FlowchartNode, FlowchartEdge } from '../types';

// Interfaces for the patch payload that comes from the LLM's TutorResponse
// These are flatter, as the LLM is prompted to return x, y, label directly for nodes.
export interface FlowchartNodePatch {
  id: string;
  type: string; // Should map to FlowchartNodeType
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  // Potentially other fields if the LLM suggests them for a node
}

export interface FlowchartEdgePatch {
  id: string;
  source: string;
  target: string;
  label?: string;
  // Potentially other fields
}

export interface FlowchartPatchPayload { // This structure is part of TutorResponse.flowchart_patch
  nodes_to_add: FlowchartNodePatch[];
  edges_to_add: FlowchartEdgePatch[];
}

// Request structure for the /api/flowchart/patch endpoint (client-side definition)
interface ApplyFlowchartPatchRequestClient {
  current_flowchart: FlowchartData; // Frontend's current state (nested nodes)
  patch: FlowchartPatchPayload;     // The patch from the LLM
}

// Response structure from /api/flowchart/patch (backend returns a flat flowchart)
// These types define the flat structure returned by the backend's patch endpoint.
interface FlatFlowchartNodeBackend {
  id: string;
  type: string; // FlowchartNodeType as string
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  // other fields that might exist on a node after backend processing
}

interface FlatFlowchartEdgeBackend {
  id: string;
  source: string;
  target: string;
  label?: string;
  // other fields
}

interface PatchedFlowchartResponseBackend { // What /api/flowchart/patch returns
  nodes: FlatFlowchartNodeBackend[];
  edges: FlatFlowchartEdgeBackend[]; // Edges are typically already flat in FlowchartData
}

export const applyFlowchartPatch = async (
  data: ApplyFlowchartPatchRequestClient
): Promise<PatchedFlowchartResponseBackend> => {
  const baseUrl = getApiBaseUrl();
  const targetPath = "/api/flowchart/patch";
  const targetUrl = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}${targetPath}` : `${baseUrl}${targetPath}`;

  // Transform frontend's nested FlowchartNode structure to the flat structure
  // expected by the backend for `current_flowchart.nodes`.
  const flatNodesForBackend = data.current_flowchart.nodes.map(node => ({
    id: node.id,
    type: node.type,
    label: node.data.label, // Extract from data object
    x: node.position.x,     // Extract from position object
    y: node.position.y,     // Extract from position object
    // width and height are not standard in FlowchartNode, but LLM might suggest them.
    // If they are part of node.data or similar, extract them here if backend needs them.
    // For now, assuming basic flat structure for backend.
  }));

  const backendRequestPayload = {
    current_flowchart: {
      nodes: flatNodesForBackend,
      edges: data.current_flowchart.edges, // Edges in FlowchartData are already suitably flat
    },
    patch: data.patch, // nodes_to_add and edges_to_add in patch are already flat
  };

  console.log("[DEBUG] Sending to /api/flowchart/patch:", JSON.stringify(backendRequestPayload, null, 2));

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add Authorization header here if this endpoint becomes protected
    },
    body: JSON.stringify(backendRequestPayload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("API Error Response (applyFlowchartPatch):", errorBody);
    throw new Error(`API request to /api/flowchart/patch failed with status ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<PatchedFlowchartResponseBackend>;
};
