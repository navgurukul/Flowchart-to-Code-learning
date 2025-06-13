from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import google.generativeai as genai
import json # Import json module

app = FastAPI()

# Configure the Gemini API key
# IMPORTANT: The API key should be set as an environment variable 'GEMINI_API_KEY'
# For local development, you can set this in your terminal before running uvicorn:
# export GEMINI_API_KEY="YOUR_API_KEY" (on Linux/macOS)
# $Env:GEMINI_API_KEY="YOUR_API_KEY" (on Windows PowerShell)
try:
    gemini_api_key = os.environ["GEMINI_API_KEY"]
    genai.configure(api_key=gemini_api_key)
    # Initialize a specific Gemini model (e.g., gemini-pro for text generation)
    # This model instance can be used later in the chat endpoint
    model = genai.GenerativeModel('gemini-pro')
except KeyError:
    model = None # Or raise an error, or handle appropriately
    print("ERROR: GEMINI_API_KEY environment variable not set.")
    print("The AI features will not work until the API key is provided.")
except Exception as e:
    model = None
    print(f"ERROR: An unexpected error occurred during Gemini SDK configuration: {e}")
    print("The AI features may not work correctly.")


class ChatMessage(BaseModel):
    message: str

@app.get("/")
async def read_root():
    return {"message": "Flowchart AI Backend is running! (Gemini Configured - Check Logs for Status)"}

@app.post("/api/chat")
async def handle_chat_message(chat_message: ChatMessage):
    if model is None:
        # Use HTTPException for clearer error reporting to client
        raise HTTPException(status_code=503, detail="AI Service not configured. Please check server logs.")

    user_message = chat_message.message.strip()
    response_text = ""
    is_structured_data = False # Flag to indicate if response is structured

    try:
        if user_message.lower().startswith("/learn "):
            topic = user_message[len("/learn "):].strip()
            if not topic:
                response_text = "Please specify a topic after /learn. For example: /learn loops"
            else:
                prompt = (
                    f"Explain the programming concept of '{topic}' clearly and concisely, as if to a beginner learning about flowcharts.\n"
                    f"Your explanation should include:\n"
                    f"1. A definition of the concept.\n"
                    f"2. How it is typically represented in a flowchart (mention symbol types if specific).\n"
                    f"3. A very simple pseudo-code or code example (e.g., Python or JavaScript) to illustrate its use.\n"
                    f"4. One or two key takeaways or common pitfalls related to '{topic}'.\n"
                    f"Focus on educational value and clarity. Use markdown for formatting if it helps readability (e.g., for lists or code blocks)."
                )
                ai_response = await model.generate_content_async(prompt) # Use async version if available and FastAPI endpoint is async
                response_text = ai_response.text
        elif user_message.lower().startswith("/generate "):
            description = user_message[len("/generate "):].strip()
            if not description:
                response_text = "Please provide a description after /generate. For example: /generate a flowchart for making tea"
            else:
                # New prompt for /generate asking for JSON
                prompt = (
                    f"Generate a simple flowchart representation for the task: '{description}'.\n"
                    f"Output your response as a single JSON object containing two keys: 'nodes' and 'edges'.\n"
                    f"'nodes' should be an array of objects, where each node has at least 'id' (string, unique), 'label' (string), and 'type' (string, e.g., 'start', 'end', 'process', 'decision', 'input', 'output'). You can optionally add a 'position' object with 'x' and 'y' numbers, but it's not critical for this initial structured output.\n"
                    f"'edges' should be an array of objects, where each edge has at least 'id' (string, unique), 'source' (string, matches a node id), and 'target' (string, matches a node id). \n"
                    f"Example node: {{'id': 'n1', 'label': 'Start', 'type': 'start'}}\n"
                    f"Example edge: {{'id': 'e1', 'source': 'n1', 'target': 'n2'}}\n"
                    f"Keep the flowchart simple, with a few nodes and edges to represent the core logic for '{description}'.\n"
                    f"If you cannot generate a valid JSON structure for any reason, please explain the steps in plain text as before."
                )
                ai_response = await model.generate_content_async(prompt)

                # Attempt to parse the AI response as JSON
                try:
                    # The .text from Gemini might be wrapped in markdown (```json ... ```)
                    potential_json = ai_response.text
                    if potential_json.strip().startswith("```json"):
                        potential_json = potential_json.strip()[7:-3].strip() # Remove markdown fences
                    elif potential_json.strip().startswith("```"): # More generic markdown fence removal
                         potential_json = potential_json.strip()[3:-3].strip()

                    parsed_json = json.loads(potential_json)
                    # Basic validation: check if it has 'nodes' and 'edges' keys and they are lists
                    if isinstance(parsed_json, dict) and \
                       'nodes' in parsed_json and isinstance(parsed_json['nodes'], list) and \
                       'edges' in parsed_json and isinstance(parsed_json['edges'], list):
                        response_text = json.dumps(parsed_json, indent=2) # Pretty print JSON string
                        is_structured_data = True
                    else:
                        # It parsed as JSON but not the expected structure, use raw text
                        response_text = ai_response.text
                except json.JSONDecodeError:
                    # Not valid JSON, use the raw text response
                    response_text = ai_response.text
                except Exception: # Catch any other parsing/validation error
                    response_text = ai_response.text # Fallback to raw text

        else:
            # For now, only respond to specific commands
            # In the future, could add general chat capabilities here
            response_text = "Sorry, I can only respond to `/learn <topic>` and `/generate <description>` commands at the moment."
            # Alternatively, to make it more conversational (but might require more prompt engineering):
            # prompt = f"User's query: {user_message}. Respond helpfully. If it's not a question about flowcharts or programming, you can say you are specialized in those areas."
            # ai_response = await model.generate_content_async(prompt)
            # response_text = ai_response.text


    except Exception as e:
        print(f"Error during AI content generation: {e}")
        # It's good practice to catch specific exceptions from the SDK if known
        # For example, if the SDK has google.generativeai.types.BlockedPromptException or similar
        # from google.generativeai.types import BlockedPromptException (example, check actual SDK)
        # except BlockedPromptException:
        #     raise HTTPException(status_code=400, detail="Your request was blocked by the AI's safety filters.")
        raise HTTPException(status_code=500, detail=f"An error occurred while processing your request with the AI: {str(e)}")

    return {"response": response_text, "isStructuredData": is_structured_data} # Add new flag to response

# To run this application:
# 1. Make sure you are in the 'backend' directory in your terminal.
# 2. Create a virtual environment: python -m venv venv
# 3. Activate it:
#    - Windows: venv\Scripts\activate
#    - macOS/Linux: source venv/bin/activate
# 4. Install dependencies: pip install -r requirements.txt
# 5. Run the server: uvicorn main:app --reload --port 8000
#    (Note: Changed port to 8000 to avoid common conflicts)
