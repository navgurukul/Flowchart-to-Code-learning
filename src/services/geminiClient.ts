// Direct Gemini API client for browser
// No backend needed!

interface GeminiRequest {
  message: string;
  command: 'chat' | 'learn' | 'generate';
  exerciseContext?: {
    exerciseId: string | null;
    title: string | null;
  } | null;
}

interface GeminiResponse {
  text: string;
  isStructuredData: boolean;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export const callGeminiDirectly = async (request: GeminiRequest): Promise<GeminiResponse> => {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not set. Please add it to your .env file.');
  }

  let prompt = '';
  let isStructuredData = false;

  // Build prompt based on command
  if (request.command === 'learn') {
    const topic = request.message;
    const contextPrefix = request.exerciseContext?.title 
      ? `Within the context of the exercise titled '${request.exerciseContext.title}', `
      : '';

    prompt = `${contextPrefix}Explain the programming concept of '${topic}' clearly and concisely, as if to a beginner learning about flowcharts.

Your explanation should include:
1. A definition of the concept.
2. How it is typically represented in a flowchart (mention symbol types if specific).
3. A very simple pseudo-code or code example (e.g., Python or JavaScript) to illustrate its use.
4. One or two key takeaways or common pitfalls related to '${topic}'.

Focus on educational value and clarity. Use markdown for formatting if it helps readability (e.g., for lists or code blocks).`;

  } else if (request.command === 'generate') {
    const description = request.message;
    isStructuredData = true;

    prompt = `Generate a complete flowchart solution for: "${description}"

RETURN ONLY VALID JSON matching this EXACT schema:
{
  "nodes": [{"id": "unique_string", "type": "start|end|process|decision|input|output|loop", "data": {"label": "text", "value": "", "condition": ""}, "position": {"x": number, "y": number}}],
  "edges": [{"id": "unique_string", "source": "node_id", "target": "node_id", "label": "Yes|No|empty", "type": "default"}]
}

IMPORTANT RULES:
1. Node types must be: "start", "end", "process", "decision", "input", "output", or "loop"
2. Every flowchart MUST have exactly ONE "start" node and ONE "end" node
3. Start node should be at position {"x": 250, "y": 50}
4. Space nodes vertically by 150px, horizontally by 250px
5. Decision nodes MUST have "Yes" and "No" edges
6. All nodes must be connected in a logical flow
7. Use clear, descriptive labels

EXAMPLE for "check if number is even":
{
  "nodes": [
    {"id": "start-1", "type": "start", "data": {"label": "Start"}, "position": {"x": 250, "y": 50}},
    {"id": "input-1", "type": "input", "data": {"label": "Read number"}, "position": {"x": 250, "y": 150}},
    {"id": "decision-1", "type": "decision", "data": {"label": "number % 2 == 0?", "condition": "number % 2 == 0"}, "position": {"x": 250, "y": 250}},
    {"id": "output-1", "type": "output", "data": {"label": "Display 'Even'"}, "position": {"x": 100, "y": 350}},
    {"id": "output-2", "type": "output", "data": {"label": "Display 'Odd'"}, "position": {"x": 400, "y": 350}},
    {"id": "end-1", "type": "end", "data": {"label": "End"}, "position": {"x": 250, "y": 450}}
  ],
  "edges": [
    {"id": "e1", "source": "start-1", "target": "input-1", "type": "default"},
    {"id": "e2", "source": "input-1", "target": "decision-1", "type": "default"},
    {"id": "e3", "source": "decision-1", "target": "output-1", "label": "Yes", "type": "default"},
    {"id": "e4", "source": "decision-1", "target": "output-2", "label": "No", "type": "default"},
    {"id": "e5", "source": "output-1", "target": "end-1", "type": "default"},
    {"id": "e6", "source": "output-2", "target": "end-1", "type": "default"}
  ]
}

Now generate the flowchart for: "${description}"`;

  } else {
    // Regular chat
    prompt = `You are FlowBot, a helpful assistant for learning programming through flowcharts. 
    
User message: ${request.message}

Provide a helpful, concise response. If the user is asking about flowcharts, programming concepts, or needs help with an exercise, provide clear guidance.`;
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: request.command === 'generate' ? 0.1 : 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI';

    // Clean up JSON response if it's wrapped in markdown code blocks
    if (isStructuredData) {
      text = text.trim();
      if (text.startsWith('```json')) {
        text = text.slice(7, -3).trim();
      } else if (text.startsWith('```')) {
        text = text.slice(3, -3).trim();
      }
    }

    return {
      text,
      isStructuredData
    };

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};
