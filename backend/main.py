from datetime import datetime, timezone # Added import
from typing import List, Optional # Added import
from fastapi import FastAPI, HTTPException, Request, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import google.generativeai as genai
import json
from dotenv import load_dotenv  # <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< IMPORT THIS
import firebase_admin
from firebase_admin import credentials, auth, db
from typing import Optional  # Added for Optional email in FirebaseUser

# --- .env DEBUG START ---
print("DEBUG: Script starting. Attempting to load .env file...")
# Construct explicit path, assuming main.py is in 'backend' and .env is also in 'backend'
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    # override=True ensures that if .env is found, its values are loaded even if system env vars exist.
    # For this debug, it helps confirm .env is being read.
    loaded_successfully = load_dotenv(dotenv_path=dotenv_path, override=True)
    print(
        f"DEBUG: Explicit load_dotenv(path='{dotenv_path}') attempted. Success: {loaded_successfully}")
else:
    print(
        f"DEBUG: .env file NOT FOUND at explicit path: {dotenv_path}. Trying default load_dotenv().")
    loaded_successfully = load_dotenv(override=True)  # Try default path
    print(
        f"DEBUG: Default load_dotenv() attempted. Success: {loaded_successfully}")

retrieved_api_key_immediately = os.environ.get("GEMINI_API_KEY")
if retrieved_api_key_immediately:
    print(
        f"DEBUG: GEMINI_API_KEY after load_dotenv: '{retrieved_api_key_immediately[:5]}...' (partially shown)")
else:
    print("DEBUG: GEMINI_API_KEY is NOT in os.environ immediately after load_dotenv() attempt.")
# --- .env DEBUG END ---

# Firebase Admin SDK Initialization
try:
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path:
        print("WARNING: GOOGLE_APPLICATION_CREDENTIALS environment variable not set. Firebase Admin SDK will not be initialized.")
        # Or raise an error if Firebase is critical for the app to start
    elif not os.path.exists(cred_path):  # Check if the path actually exists
        print(
            f"ERROR: Firebase credentials file not found at path: {cred_path}. Firebase Admin SDK will not be initialized.")
    else:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("INFO: Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"ERROR: Failed to initialize Firebase Admin SDK: {e}")

app = FastAPI()

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://flowchart-to-code-learning.vercel.app",  # Frontend on Vercel
    # <-- Add your backend Render URL for completeness
    "https://flowchart-to-code-learning-1.onrender.com",
    "https://flowchart-learner-git-langchain-vinit-sources-projects.vercel.app",
    "https://flowchart-learner.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # More secure to list specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API Configuration


def configure_gemini(gemini_version: str = "2.0") -> Optional[genai.GenerativeModel]:
    """
    Configures the Gemini API with the API key from environment variables.
    This function is called at the start of the application to ensure
    the Gemini SDK is ready for use.
    """
    global model  # Declare model as global to modify it in this function
    model = None  # Initialize model to None

    try:
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        # This debug print is crucial
        if gemini_api_key:
            print(
                f"DEBUG: GEMINI_API_KEY FOUND in environment. Value: '{gemini_api_key[:5]}...' (partially shown)")
        else:
            print(
                "DEBUG: GEMINI_API_KEY NOT FOUND in os.environ during Gemini configuration.")

        if not gemini_api_key:
            raise KeyError(
                "GEMINI_API_KEY not found in environment. Please ensure it is set in your system environment (e.g., Render service environment variables) or in a 'backend/.env' file for local development.")

        genai.configure(api_key=gemini_api_key)
        print("INFO: Gemini SDK configured with API key.")

        # List available models (inside try block, after configure)
        print("INFO: Listing available Gemini models (if SDK configured)...")
        models_found_supporting_generate_content = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                models_found_supporting_generate_content.append(m.name)
                print(
                    f"  - Model Name: {m.name}, Supported: {m.supported_generation_methods}, Display: {m.display_name}")
        print("INFO: Finished listing models.")

        if not models_found_supporting_generate_content:
            print("WARNING: No models found supporting 'generateContent'. The chat functionality might not work as expected.")
            # Depending on strictness, you might raise an error or allow app to run with 'model = None'

        # Initialize a specific Gemini model - YOU MIGHT NEED TO CHANGE 'gemini-pro'
        # based on the output of list_models() above.
        # model_name_to_use = 'gemini-1.5-flash' # Old default

        # --- START MODIFICATION ---
        # Preferred model, including the 'models/' prefix as seen in the user's logs
        if gemini_version == "2.0":
            preferred_model_name = 'models/gemini-2.0-flash'
        elif gemini_version == "2.5":
            preferred_model_name = 'models/gemini-2.5-pro-preview-06-05'
        # Alternative if the preferred_model_name isn't found for some reason
        alternative_model_name = 'models/gemini-2.0-flash'

        model_name_to_use = None  # Will be set from available models

        if models_found_supporting_generate_content:
            if preferred_model_name in models_found_supporting_generate_content:
                model_name_to_use = preferred_model_name
                print(
                    f"INFO: Preferred model '{model_name_to_use}' is available.")
            elif alternative_model_name in models_found_supporting_generate_content:
                model_name_to_use = alternative_model_name
                print(
                    f"INFO: Preferred model not found. Using alternative '{model_name_to_use}'.")
            else:
                # Fallback to the first available model that supports 'generateContent'
                # This was the previous problematic behavior if preferred wasn't exactly 'gemini-pro'
                # Now it's a more informed fallback.
                model_name_to_use = models_found_supporting_generate_content[0]
                print(
                    f"WARNING: Preferred models ('{preferred_model_name}', '{alternative_model_name}') not found. Automatically selected first available model: '{model_name_to_use}'.")
        else:
            # No models support 'generateContent', so model cannot be initialized.
            print(f"ERROR: No models supporting 'generateContent' are available with your API key. Cannot initialize a model.")
            raise Exception(
                "No suitable Gemini model found for 'generateContent'.")

        model = genai.GenerativeModel(model_name_to_use)
        print(
            f"INFO: Gemini model '{model_name_to_use}' initialized successfully.")
        return model  # Return the initialized model

    except KeyError as e_key:
        # model remains None from its initialization at the top of the try block
        print(f"ERROR (KeyError): {str(e_key)}")
        print("       The AI features will not work. Example for .env: GEMINI_API_KEY=YOUR_KEY_HERE")
        return None  # Return None to indicate failure
    except Exception as e_gen:
        # model remains None
        print(f"ERROR (General Exception during Gemini Setup): {str(e_gen)}")
        print("       The AI features may not work correctly.")
        return None  # Return None to indicate failure


class ChatMessage(BaseModel):
    message: str
    exercise_id: Optional[str] = None
    exercise_title: Optional[str] = None


class UserDetails(BaseModel):
    last_active: datetime
    points: int
    tasks_completed: List[str]


class IdToken(BaseModel):
    token: str


class FirebaseUser(BaseModel):
    uid: str
    email: Optional[str] = None


class AuthenticatedUser(BaseModel):
    uid: str
    email: str

# Security scheme for Bearer token
oauth2_scheme = HTTPBearer()
ALLOWED_DOMAIN = "navgurukul.org"

async def get_current_user_data(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)) -> AuthenticatedUser:
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        if not email or not uid:
            raise HTTPException(status_code=401, detail="UID or Email not found in token.")
        if not email.endswith(f"@{ALLOWED_DOMAIN}"):
            raise HTTPException(status_code=403, detail=f"Access restricted to {ALLOWED_DOMAIN} domain.")
        return AuthenticatedUser(uid=uid, email=email)
    except firebase_admin.auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException as http_exc:
        raise http_exc # Re-raise HTTPException explicitly
    except Exception as e:
        # Log the exception for server-side review
        print(f"Error during token verification or domain check: {e}")
        raise HTTPException(
            status_code=500, # Keep this for genuinely unexpected errors
            detail="Could not verify authentication credentials."
        )


@app.get("/")
async def read_root():
    return {"status": "API is running"}

# Models for image import response
class Node(BaseModel):
    id: str
    type: str # Should match frontend FlowchartNodeType: 'start', 'end', 'process', 'decision', 'input', 'output', 'loop'
    label: str
    x: int
    y: int
    width: int
    height: int

class Edge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None

class FlowchartResponse(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    error: Optional[str] = None
    fallback_used: Optional[bool] = False

@app.post("/api/import-image", response_model=FlowchartResponse)
async def import_image(file: UploadFile = File(...)):
    """
    Accepts an image file, processes it (placeholder), and returns flowchart nodes and edges.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image format. Only JPG/PNG accepted for now.")

    # --- CV Model and OCR Processing --- (REMOVED YOLO/ULTRALYTICS)

    # Placeholder for image processing logic if it's ever re-added without YOLO.
    # For now, as YOLO was the core of this endpoint, we'll return an error
    # indicating the feature is not available.

    print("DEBUG: /api/import-image endpoint called, but YOLO/ultralytics functionality has been removed.")
    # raise HTTPException(status_code=501, detail="Image import functionality is currently disabled.")

    # Fallback response as per original code's structure if YOLO fails or provides no nodes.
    # This makes the endpoint still return a valid FlowchartResponse structure,
    # albeit one that indicates an issue.
    return FlowchartResponse(
        nodes=[Node(id="disabled-1", type="process", label="Image import is currently disabled.", x=50, y=50, width=250, height=40)],
        edges=[],
        error="Image import functionality is currently disabled as the CV model is not available.",
        fallback_used=True
    )

@app.post("/api/chat")
async def handle_chat_message(chat_message: ChatMessage): # Removed current_user dependency
    # print(f"User {current_user.email} (UID: {current_user.uid}) accessing chat.") # Commented out as current_user is removed
    user_message = chat_message.message.strip()
    response_text = ""
    is_structured_data = False

    try:
        if user_message.lower().startswith("/learn "):
            topic = user_message[len("/learn "):].strip()

            if not topic:
                response_text = "Please specify a topic after /learn. For example: /learn loops"
            else:
                context_prefix = ""
                if chat_message.exercise_title:
                    context_prefix = f"Within the context of the exercise titled '{chat_message.exercise_title}', "
                    print(f"DEBUG: Received exercise context: ID='{chat_message.exercise_id}', Title='{chat_message.exercise_title}'")

                prompt = (
                    f"{context_prefix}Explain the programming concept of '{topic}' clearly and concisely, as if to a beginner learning about flowcharts.\n"
                    f"Your explanation should include:\n"
                    f"1. A definition of the concept.\n"
                    f"2. How it is typically represented in a flowchart (mention symbol types if specific).\n"
                    f"3. A very simple pseudo-code or code example (e.g., Python or JavaScript) to illustrate its use.\n"
                    f"4. One or two key takeaways or common pitfalls related to '{topic}'.\n"
                    f"Focus on educational value and clarity. Use markdown for formatting if it helps readability (e.g., for lists or code blocks)."
                )
                # Print first 100 chars for brevity
                print(f"DEBUG: topic '{topic[:100]}' with context prefix: '{context_prefix[:100]}'")

                # Ensure model is configured
                print("DEBUG: Attempting to configure Gemini model for '/learn' command...")
                model = configure_gemini(gemini_version="2.0")
                if model is None:
                    print("ERROR: Gemini model is None after configuration attempt in '/learn'.")
                    raise HTTPException(
                        status_code=503, detail="AI Service not configured or model not available. Critical: GEMINI_API_KEY might be missing or invalid in the deployment environment (e.g., Render settings). Also, check model availability for your key.")

                print(f"DEBUG: Gemini model object before calling generate_content_async: {model}")
                ai_response = await model.generate_content_async(prompt)
                # Print first 100 chars for brevity
                print(f"DEBUG: AI response received: {ai_response.text[:100]}...")
            response_text = ai_response.text
        elif user_message.lower().startswith("/generate "):
            description = user_message[len("/generate "):].strip()
            if not description:
                response_text = "Please provide a description after /generate. For example: /generate a flowchart for making tea"
            else:
                prompt = (
                    f"Generate a complete flowchart solution for: \"{description}\"\n\n"
                    "RETURN ONLY VALID JSON matching this EXACT schema:\n{\n  \"nodes\": [{\"id\": \"unique_string\", \"type\": \"terminal|process|decision|input|output\", \"label\": \"text\", \"x\": number, \"y\": number}],\n  \"edges\": [{\"id\": \"unique_string\", \"source\": \"node_id\", \"target\": \"node_id\", \"label\": \"Yes|No|empty\"}],\n  \"problemStatement\": \"clear 1-2 sentence description\",\n  \"inputType\": \"single|multiple|array|object\",\n  \"outputType\": \"number|string|boolean|array|object\",\n  \"sampleInputs\": [\"input1\", \"input2\", \"input3\"],\n  \"sampleOutputs\": [\"output1\", \"output2\", \"output3\"]\n}\n\nCONSISTENCY RULES:\n1. STANDARD PATTERNS for common algorithms:\n   - Fibonacci: Start(1400,1200) → Input n → Check \"n <= 1\" → [Yes: Return n] [No: Calculate iteratively] → Output → End\n   - Factorial: Start(1400,1200) → Input n → Check \"i <= n\" →  [Yes: Calculate factorial = i*factorial] [No: Return 1] → Output → End\n   - Prime Check: Start(1400,1200) → Input n → Check \"n <= 1\" → [Yes: Return false] [No: Loop check divisibility] → Output → End\n   - Even/Odd: Start(1400,1200) → Input n → Check \"n % 2 == 0\" → [Yes: Return \"Even\"] [No: Return \"Odd\"] → End\n\n2. POSITIONING: Start at (1400,1200), space adjacent nodes 150px vertically, 250px horizontally from each other\n3. NAMING: Use standard variables: n, result, i, temp, a, b. Be specific in process nodes.\n4. DECISIONS: Always use \"Yes\"/\"No\" labels, clear conditions like \"n <= 1\", \"i < n\", \"num % 2 == 0\"\n5. FLOW: Logical sequence - Start → Input → Process/Decision → Output → End\n6. LABELS: Process nodes: \"variable = expression\", Input: \"Read variable\", Output: \"Display result\"\n\nSAMPLE DATA RULES:\n- Provide exactly 3 test cases\n- sampleInputs must match inputType format (single=string/number, array=JSON array, object=JSON object)\n- sampleOutputs must match expected results and outputType\n- Use realistic, diverse test cases including edge cases\n\nEXAMPLE: For \"check if number is even\": inputType=\"single\", outputType=\"boolean\", sampleInputs=[\"4\",\"7\",\"0\"], sampleOutputs=[\"true\",\"false\",\"true\"]"
                )
                # Define the JSON schema for flowchart responses
                response_schema = {
                    "type": "object",
                    "properties": {
                        "nodes": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "type": {"type": "string", "enum": ["terminal", "process", "decision", "input", "output"]},
                                    "label": {"type": "string"},
                                    "x": {"type": "number"},
                                    "y": {"type": "number"}
                                },
                                "required": ["id", "type", "label", "x", "y"]
                            }
                        },
                        "edges": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "source": {"type": "string"},
                                    "target": {"type": "string"},
                                    "label": {"type": "string"}
                                },
                                "required": ["id", "source", "target"]
                            }
                        },
                        "problemStatement": {"type": "string"},
                        "inputType": {"type": "string", "enum": ["single", "multiple", "array", "object"]},
                        "outputType": {"type": "string", "enum": ["number", "string", "boolean", "array", "object"]},
                        "sampleInputs": {"type": "array", "items": {"type": "string"}},
                        "sampleOutputs": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["nodes", "edges", "problemStatement", "inputType", "outputType", "sampleInputs", "sampleOutputs"]
                }

                # Create generation config with the schema
                generation_config = genai.GenerationConfig(
                    temperature=0.1,
                    top_p=0.8,
                    top_k=40,
                    stop_sequences=[],
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    candidate_count=1
                )
                print("DEBUG: Attempting to configure Gemini model for '/generate' command with version 2.0 (e.g., gemini-2.0-flash)...")
                model = configure_gemini(gemini_version="2.0") # Changed from "2.5" to "2.0"
                if model is None:
                    print("ERROR: Gemini model is None after configuration attempt in '/generate' with version 2.0.")
                    raise HTTPException(
                        status_code=503, detail="AI Service not configured or model not available. Critical: GEMINI_API_KEY might be missing or invalid in the deployment environment (e.g., Render settings). Also, check model availability for your key."
                    )

                print(f"DEBUG: Gemini model object before calling generate_content_async: {model}")
                # Pass the generation config to generate_content_async
                ai_response = await model.generate_content_async(prompt, generation_config=generation_config)
                try:
                    potential_json = ai_response.text
                    if potential_json.strip().startswith("```json"):
                        potential_json = potential_json.strip()[7:-3].strip()
                    elif potential_json.strip().startswith("```"):
                        potential_json = potential_json.strip()[3:-3].strip()
                    parsed_json = json.loads(potential_json)
                    if isinstance(parsed_json, dict) and \
                       'nodes' in parsed_json and isinstance(parsed_json['nodes'], list) and \
                       'edges' in parsed_json and isinstance(parsed_json['edges'], list):
                        response_text = json.dumps(parsed_json, indent=2)
                        is_structured_data = True
                    else:
                        response_text = ai_response.text
                except Exception:
                    response_text = ai_response.text
        else:
            response_text = "Sorry, I can only respond to `/learn <topic>` and `/generate <description>` commands at the moment."

    except Exception as e:
        print(f"Error during AI content generation: {e}")
        raise HTTPException(
            status_code=500, detail=f"An error occurred while processing your request with the AI: {str(e)}")

    return {"response": response_text, "isStructuredData": is_structured_data}


@app.post("/api/auth/google")
async def google_auth(request: Request):
    data = await request.json()
    token = data.get("token")
    if not token:
        return JSONResponse(status_code=400, content={"detail": "No token provided"})
    # Optionally: verify token with Firebase Admin SDK here
    return {"status": "ok"}


@app.post("/auth/google", response_model=FirebaseUser)
async def auth_google_signin(id_token_body: IdToken):
    token_string = id_token_body.token
    try:
        # Note: verify_id_token is synchronous.
        # If this becomes a performance bottleneck, consider running it in a thread pool:
        # from fastapi.concurrency import run_in_threadpool
        # decoded_token = await run_in_threadpool(auth.verify_id_token, token_string)
        decoded_token = auth.verify_id_token(token_string)
        uid = decoded_token['uid']
        email = decoded_token.get('email')

        if not email:
            raise HTTPException(status_code=400, detail="Email not found in token.")

        if not email.endswith('@navgurukul.org'):
            raise HTTPException(status_code=403, detail="Access restricted to navgurukul.org domain.")

        # Here you would typically create or update the user in your database
        return FirebaseUser(uid=uid, email=email)
    except firebase_admin.auth.InvalidIdTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid ID token: {e}")
    except HTTPException as http_exc: # Re-raise HTTPException
        raise http_exc
    except Exception as e:  # Catch other potential errors during token verification
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {e}")


@app.get("/users/{user_id}/details", response_model=UserDetails)
async def get_user_details(user_id: str, current_user: AuthenticatedUser = Depends(get_current_user_data)):
    # Now current_user.uid contains the UID of the authenticated user.
    # And current_user.email contains their email.
    # The domain check is already handled by get_current_user_data.

    if current_user.uid != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user's details.")

    print(f"User {current_user.email} (UID: {current_user.uid}) requesting details for {user_id}.")

    try:
        # Ensure Firebase Admin SDK is initialized
        if not firebase_admin._apps:
            # This is a fallback, ideally initialization happens at startup
            cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print("INFO: Firebase Admin SDK re-initialized in get_user_details (fallback).")
            else:
                raise HTTPException(status_code=500, detail="Firebase Admin SDK not initialized and credentials missing.")

        user_progress_ref = db.reference(f'userProgress/{user_id}')
        progress_data = user_progress_ref.get()

        if progress_data:
            # Convert tasks_completed from numbers to strings if necessary,
            # or ensure they are stored as strings if that's what UserDetails expects.
            # Based on StudentProgress, completedExercises are numbers.
            # UserDetails expects tasks_completed as List[str].
            # This is a mismatch. For now, I will adapt to UserDetails, but this might need further review.
            tasks_completed_str = [str(ex_id) for ex_id in progress_data.get("completedExercises", [])]

            # Ensure last_active is a datetime object
            last_active_iso = progress_data.get("lastAccessedAt", datetime.now(timezone.utc).isoformat())
            try:
                last_active_dt = datetime.fromisoformat(last_active_iso.replace("Z", "+00:00"))
            except ValueError: # Handle cases where it might not be full ISO format
                 last_active_dt = datetime.strptime(last_active_iso, "%Y-%m-%dT%H:%M:%S.%fZ") if '.' in last_active_iso else datetime.fromisoformat(last_active_iso)


            user_details = UserDetails(
                last_active=last_active_dt,
                points=progress_data.get("totalScore", 0),
                tasks_completed=tasks_completed_str # Store as list of strings of exercise IDs
            )
            return user_details
        else:
            # Return default UserDetails if no progress found, or raise 404
            # For consistency with frontend's defaultInitialProgress:
            return UserDetails(
                last_active=datetime.utcnow(),
                points=0,
                tasks_completed=[]
            )
    except Exception as e:
        print(f"Error fetching user details from Firebase: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user details: {str(e)}")


@app.get("/api/online-users")
async def get_online_users():
    try:
        ref = db.reference("/status")
        status_data = ref.get()

        if status_data is None or not isinstance(status_data, dict):
            count = 0
        else:
            count = 0
            for user_status in status_data.values(): # Iterate through the values (dictionaries for each user)
                if isinstance(user_status, dict) and user_status.get("online") is True:
                    count += 1

        return {"online_users": count}
    except Exception as e:
        # Log the error for debugging
        print(f"Error accessing Firebase Realtime Database: {e}")
        # Return a generic error message to the client
        raise HTTPException(status_code=500, detail="Failed to retrieve online user count from the database.")

# Comments for running the app
# To run this application:
# 1. Make sure you are in the 'backend' directory in your terminal.
# 2. Create a virtual environment: python -m venv venv
# 3. Activate it:
#    - Windows: venv\Scripts\activate
#    - macOS/Linux: source venv/bin/activate
# 4. Install dependencies: pip install -r requirements.txt
# 5. Set your GEMINI_API_KEY:
#    - Create a file named '.env' in this 'backend' directory.
#    - Add the line: GEMINI_API_KEY=YOUR_ACTUAL_API_KEY
#    OR set it as a system environment variable.
# 6. Run the server: uvicorn main:app --reload --port 8000
